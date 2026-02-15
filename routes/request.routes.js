const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const authMiddleware = require('../middleware/auth');

// Aplicamos el middleware de autenticación a TODAS las rutas de este archivo.
// Esto asegura que req.user exista en el controlador.
const { verifyToken } = require('../middleware/auth'); 
// -------------------

// Ahora usamos verifyToken directamente, que sí es la función middleware
router.use(verifyToken);

// Definición de endpoints
router.get('/', requestController.getRequests);       // GET /api/requests
router.post('/', requestController.createRequest);    // POST /api/requests
router.delete('/:id', requestController.deleteRequest); // DELETE /api/requests/:id
router.put('/:id', requestController.updateRequest); // PUT /api/requests/:id

module.exports = router;