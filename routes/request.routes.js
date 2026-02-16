const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const authMiddleware = require('../middleware/auth');
const { validateRequestBody } = require('../middleware/validation');

const verifyToken = authMiddleware.verifyToken || authMiddleware;

// Middleware para ejecutar validación de solicitud
const runRequestValidation = (req, res, next) => {
    const { isValid, errors } = validateRequestBody(req.body);
    if (!isValid) return res.status(400).json({ message: 'Error en los datos de la solicitud', errors });
    next();
};

router.get('/', verifyToken, requestController.getAllRequests);
router.post('/', verifyToken, runRequestValidation, requestController.createRequest); // <-- Agregado aquí
router.delete('/:id', verifyToken, requestController.deleteRequest);
router.put('/:id', verifyToken, runRequestValidation, requestController.updateRequest);

module.exports = router;