/**
 * @file auth.routes.js - Rutas de autenticación (/api/auth).
 * POST /register - Registro con validación de campos.
 * POST /login    - Inicio de sesión con validación.
 * GET  /clients  - Lista de clientes (requiere JWT).
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const { validateRegisterBody, validateLoginBody } = require('../middleware/validation');

const verifyToken = authMiddleware.verifyToken || authMiddleware;

/** Envuelve una función de validación síncrona en un middleware Express. */
const runValidation = (validationFn) => (req, res, next) => {
    const { isValid, errors } = validationFn(req.body);
    if (!isValid) {
        return res.status(400).json({ message: 'Error de validación', errors });
    }
    next();
};

router.post('/register', runValidation(validateRegisterBody), authController.register);
router.post('/login', runValidation(validateLoginBody), authController.login);
router.get('/clients', verifyToken, authController.getClients);

module.exports = router;