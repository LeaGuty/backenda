/**
 * @file auth.service.js - Lógica de negocio de autenticación.
 * Registro local, login con JWT, consulta de clientes y OAuth con GitHub.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { readJSON, writeJSON } = require('../utils/jsonStorage');

const USER_FILE = 'users.json';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

/**
 * Registra un usuario nuevo. Lanza error si el email ya existe.
 * @param {{ email: string, password: string, name?: string, role?: string, dni?: string }} userData
 * @returns {Promise<Object>} Usuario creado (sin password).
 */
async function register(userData) {
    const users = await readJSON(USER_FILE);

    if (users.find(user => user.email === userData.email)) {
        throw new Error('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = {
        id: uuidv4(),
        name: userData.name || '',
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'client',
        dni: userData.dni || '',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeJSON(USER_FILE, users);

    const { password, ...userSafe } = newUser;
    return userSafe;
}

/**
 * Autentica un usuario y genera un JWT con expiración de 24h.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, token: string }>}
 */
async function login(email, password) {
    const users = await readJSON(USER_FILE);
    const user = users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Credenciales inválidas');
    }

    const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    const { password: _, ...userSafe } = user;
    return { user: userSafe, token };
}

/**
 * Retorna todos los usuarios con rol "client" (id, name, dni).
 * Usado por agentes para asociar solicitudes a clientes.
 */
async function getAllClients() {
    const users = await readJSON(USER_FILE);
    return users
        .filter(user => user.role === 'client')
        .map(user => ({
            id: user.id,
            name: user.name,
            dni: user.dni
        }));
}

// --- OAuth GitHub ---

/** Intercambia el code de GitHub por un access_token. */
async function getGitHubAccessToken(code) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';

    if (!clientId || !clientSecret) throw new Error('Faltan credenciales de GitHub');

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    try {
        const response = await axios.post('https://github.com/login/oauth/access_token', params, {
            headers: { 'Accept': 'application/json' }
        });

        if (response.data.error) {
            throw new Error(`GitHub Error: ${response.data.error}`);
        }
        return response.data.access_token;
    } catch (error) {
        console.error("Error token exchange:", error.message);
        throw error;
    }
}

/** Obtiene el perfil del usuario autenticado en GitHub. */
async function getGitHubUser(accessToken) {
    const response = await axios.get("https://api.github.com/user", {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.data;
}

/**
 * Flujo OAuth: si el usuario de GitHub ya existe lo loguea,
 * si no lo registra como client con password null.
 */
async function loginOrRegisterWithGitHub(code) {
    const accessToken = await getGitHubAccessToken(code);
    const gitHubUser = await getGitHubUser(accessToken);

    let email = gitHubUser.email || `${gitHubUser.login}@github.com`;

    const users = await readJSON(USER_FILE);
    let user = users.find(u => u.email === email);

    if (!user) {
        user = {
            id: uuidv4(),
            email,
            password: null,
            role: 'client',
            name: gitHubUser.name || gitHubUser.login,
            avatar: gitHubUser.avatar_url,
            githubId: gitHubUser.id,
            createdAt: new Date().toISOString()
        };
        users.push(user);
        await writeJSON(USER_FILE, users);
    }

    const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return { token, user };
}

module.exports = {
    register,
    login,
    getAllClients,
    loginOrRegisterWithGitHub
};