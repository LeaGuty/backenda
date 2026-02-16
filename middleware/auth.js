/**
 * @file auth.js - Middleware de autenticación JWT.
 * Verifica el token Bearer del header Authorization y
 * adjunta el payload decodificado en req.user (id, role, name).
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

/**
 * Middleware que valida el JWT del header Authorization.
 * Si es válido, asigna el payload a req.user y continúa.
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Token no proporcionado',
            time: new Date().toISOString(),
            task_id: require('uuid').v4(),
        });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            status: 'error',
            message: 'Token no válido o expirado',
            time: new Date().toISOString(),
            task_id: require('uuid').v4(),
        });
    }
}

module.exports = { verifyToken };

