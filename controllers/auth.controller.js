const {v4: uuidv4} = require('uuid');
const authService = require('../services/auth.service');
const {validateRegisterBody, validateLoginBody} = require('../middleware/validation');
const e = require('express');

function sendSuccessResponse(res, message, data = {}) {
    res.json({
        status: 'success',
        message,
        time: new Date().toISOString(),
        task_id: uuidv4(),
        data,
    });
}

function sendErrorResponse(res, statusCode, message) {
    res.status(statusCode).json({
        status: 'error',
        message,
        time: new Date().toISOString(),
        task_id: uuidv4(),
    });
}

async function register(req, res) {
    try {
        const {email, password} = req.body;
        const validation = validateRegisterBody(req.body);
        if (!validation.isValid) {
            return sendErrorResponse(res, 400, validation.errors.join(', '));
        }
        const user = await authService.registerUser(email, password);
        sendSuccessResponse(res, 'Usuario registrado exitosamente');
    } catch (error) {
        if (error.message === 'Usuario ya existe') {
            return sendErrorResponse(res, 409, error.message);
        }else {
            return sendErrorResponse(res, 500, 'Error interno del servidor');
        }   
    }
}

async function login(req, res) {
    try {
        const {email, password} = req.body;
        const validation = validateLoginBody(req.body);
        if (!validation.isValid) {
            return sendErrorResponse(res, 400, validation.errors.join(', '));
        }
        const {token, userId} = await authService.loginUser(email, password);
        sendSuccessResponse(res, 'Inicio de sesión exitoso', { token, userId });
    } catch (error) {
        sendErrorResponse(res, 401, 'Credenciales no válidas');
    }
}

async function getMe(req, res) {
    try {
        const user = authService.getUserById(req.user.userId);
        sendSuccessResponse(res, 'Usuario obtenido exitosamente', { user });
    } catch (error) {
        if (error.message === 'Usuario no encontrado') {
            return sendErrorResponse(res, 404, error.message);
        } else {
            sendErrorResponse(res, 500, 'Error interno del servidor');
        }
    }
}

/**
 * Controlador para callback de OAuth de GitHub
 * @param {Object} req
 * @param {Object} res
 */

async function githubCallback(req, res) {
    try {
        const code = req.body.code || req.query.code;
        console.log('[GitHub OAuth] Code recibido:', code ? `${code.substring(0, 10)}...` : 'NINGUNO');
        console.log('[GitHub OAuth] req.body:', JSON.stringify(req.body));
        console.log('[GitHub OAuth] req.query:', JSON.stringify(req.query));

        if (!code) {
            return sendErrorResponse(res, 400, 'Código de autorización no proporcionado');
        }
        const result = await authService.loginOrRegisterWithGitHub(code);
        console.log('[GitHub OAuth] Resultado exitoso:', { userId: result.userId, email: result.email });
        sendSuccessResponse(res, 'Inicio de sesión con GitHub exitoso', { token: result.token, userId: result.userId, email: result.email });
    } catch (error) {
        console.error("[GitHub OAuth] ERROR COMPLETO:", error.message);
        console.error("[GitHub OAuth] Stack:", error.stack);
        sendErrorResponse(res, 500, error.message || 'Error interno del servidor');
    }
}

module.exports = {
    register,
    login,
    getMe,
    githubCallback
};


