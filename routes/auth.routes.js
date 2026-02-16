const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
// Importamos las validaciones
const { validateRegisterBody, validateLoginBody } = require('../middleware/validation');

const verifyToken = authMiddleware.verifyToken || authMiddleware;

// --- RUTAS CON VALIDACIÓN ---

// Agregamos un middleware intermedio para manejar la respuesta de error de validación
const runValidation = (validationFn) => (req, res, next) => {
    const { isValid, errors } = validationFn(req.body);
    if (!isValid) {
        return res.status(400).json({ message: 'Error de validación', errors });
    }
    next();
};

// Registro: Validamos antes de ir al controlador
router.post('/register', runValidation(validateRegisterBody), authController.register);

// Login: Validamos antes de ir al controlador
router.post('/login', runValidation(validateLoginBody), authController.login);

// Clientes
router.get('/clients', verifyToken, authController.getClients);

module.exports = router;