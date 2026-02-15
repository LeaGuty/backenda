const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { readUsers, writeUsers } = require('../utils/sileStorage');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

// --- FUNCIONES BÁSICAS (Register, Login, etc.) ---

async function registerUser(email, password) {
    const users = readUsers();
    if (users.find(user => user.email === email)) {
        throw new Error('Usuario ya existe');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), email, password: hashedPassword, createdAt: new Date().toISOString() };
    users.push(newUser);
    writeUsers(users);
    return { id: newUser.id, email: newUser.email };
}

async function loginUser(email, password) {
    const users = readUsers();
    const user = users.find(user => user.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Credenciales no válidas');
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return { token, userId: user.id, email: user.email };
}

function logoutUser() { return true; }

function getUserById(id) {
    const user = readUsers().find(user => user.id === id);
    if (!user) throw new Error('Usuario no encontrado');
    return { id: user.id, email: user.email, createdAt: user.createdAt };
}

// --- AUTENTICACIÓN GITHUB (CORREGIDA) ---

async function getGitHubAccessToken(code) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';

    console.log('[GitHub Service] clientId:', clientId);
    console.log('[GitHub Service] redirectUri:', redirectUri);

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

        console.log('[GitHub Service] Respuesta de GitHub token exchange:', JSON.stringify(response.data));

        if (response.data.error) {
            throw new Error(`GitHub Error: ${response.data.error} - ${response.data.error_description}`);
        }
        return response.data.access_token;
    } catch (error) {
        console.error("[GitHub Service] Error token exchange:", error.response?.data || error.message);
        throw error;
    }
}

async function getGitHubUser(accessToken) {
    const response = await axios.get("https://api.github.com/user", {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.data;
}

async function loginOrRegisterWithGitHub(code) {
    console.log('[GitHub Service] Iniciando loginOrRegisterWithGitHub...');
    const accessToken = await getGitHubAccessToken(code);
    console.log('[GitHub Service] Access token obtenido:', accessToken ? 'OK' : 'VACÍO');
    const gitHubUser = await getGitHubUser(accessToken);
    console.log('[GitHub Service] Usuario GitHub:', { login: gitHubUser.login, email: gitHubUser.email, id: gitHubUser.id });

    let email = gitHubUser.email || `${gitHubUser.login}@github.com`;
    
    // Si el email es privado, intentamos obtenerlo del endpoint de emails
    if (!gitHubUser.email) {
        try {
            const emailsParams = await axios.get("https://api.github.com/user/emails", {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const primary = emailsParams.data.find(e => e.primary && e.verified);
            if (primary) email = primary.email;
        } catch (e) {
            console.log("No se pudo obtener email privado, usando fallback.");
        }
    }

    const users = readUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
        user = {
            id: uuidv4(),
            email,
            password: null,
            createdAt: new Date().toISOString(),
            githubId: gitHubUser.id,
            name: gitHubUser.name || gitHubUser.login,
            avatar: gitHubUser.avatar_url
        };
        users.push(user);
        writeUsers(users);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return { token, userId: user.id, email: user.email };
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserById,
    loginOrRegisterWithGitHub
};