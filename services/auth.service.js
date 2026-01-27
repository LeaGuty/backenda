const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');
const axios = require('axios');
const { readUsers, writeUsers } = require('../utils/sileStorage');
const { Axios } = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

async function registerUser(email, password) {
    const users = readUsers();
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        throw new Error('Usuario ya existe');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeUsers(users);
    return { id: newUser.id, email: newUser.email };
}
async function loginUser(email, password) {
    const users = readUsers();
    const user = users.find(user => user.email === email);
    if (!user) {
        throw new Error('Credenciales no válidas');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error('Credenciales no válidas');
    } 
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    return { token , userId: user.id, email: user.email }; 
}
function logoutUser() {
    // En una implementación basada en JWT, el logout se maneja en el cliente
    return true;
}
function getUserById(id) {
    const users = readUsers();
    const user = users.find(user => user.id === id);
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    return { id: user.id, email: user.email , createdAt: user.createdAt};
}

/** Authentication via GitHub OAuth */


/**
 * Intercambio de código por token de acceso
 * @param {string} code
 * @return {Promise<string>} accessToken
 */
async function getGitHubAccessToken(code) {
    const clienId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clienId || !clientSecret) {
        throw new Error('GitHub OAuth credentials are not set');
    }

    const params = new URLSearchParams();
    params.append('client_id', clienId);
    params.append('client_secret', clientSecret);
    params.append('code', code);    

    const response = await axios.post('https://github.com/login/oauth/access_token', params, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

if (response.data.error) {
        throw new Error(`GitHub OAuth error: ${response.data.error_description}`);
    }
    return response.data.access_token;
}

/**
 * Obtiene datos del usuarios de GitHub
 * @param {string} accessToken
 * @returns {Object} datos del usuario
 */
async function getGitHubUser(accessToken) {
  const response = await axios.get("https://api.github.com/user", {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  })

  console.log("GitHub User Data:", response.data);

  return response.data;
}

/**
 * Maneja login de usuario o registro con GitHub Auth 
 * @param {string} code
 * @returns {Object} { token, user }
 */
async function loginOrRegisterWithGitHub(code) {
  const accessToken = await getGitHubAccessToken(code);
  const gitHubUser = await getGitHubUser(accessToken);

  const email = gitHubUser.email || `${gitHubUser.login}@github.com`;

  const users = readUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      id: uuidv4(),
      email,
      password: null,
      createdAt: new Date().toISOString(),
      githubId: gitHubUser.id
    };
    users.push(user);
    writeUsers(users);
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    return { token, user: { id: user.id, email: user.email } };
}


module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserById,
    loginOrRegisterWithGitHub
};