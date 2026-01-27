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
        const code = req.query.code;
        if (!code) {
            return sendErrorResponse(res, 400, 'Código de autorización no proporcionado');
        }
        const { token, user } = await authService.loginOrRegisterWithGitHub(code);
        sendSuccessResponse(res, 'Inicio de sesión con GitHub exitoso', { token, user });
    } catch (error) {
        console.log("GitHub OAuth Error:", error);
        sendErrorResponse(res, 500, 'Error interno del servidor');
    }
}

module.exports = {
    register,
    login,
    getMe,
    githubCallback
};


