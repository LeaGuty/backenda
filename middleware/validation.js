/**
 * @file validation.js - Funciones de validación para autenticación y solicitudes.
 * Incluye validación de RUT chileno (Módulo 11), email y contraseña.
 */

/**
 * Valida y formatea un RUT chileno usando el algoritmo Módulo 11.
 * @param {string} rut - RUT en cualquier formato (con/sin puntos y guión).
 * @returns {{ isValid: boolean, formatted: string }} RUT formateado como "XXXXXXX-X" si es válido.
 */
function validateAndFormatRut(rut) {
    if (!rut || typeof rut !== 'string') return { isValid: false, formatted: rut };

    let cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();

    if (cleanRut.length < 8) return { isValid: false, formatted: rut };

    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);

    // Algoritmo Módulo 11: multiplicadores cíclicos 2-7
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    const dvCalc = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

    const isValid = dv === dvCalc;

    return {
        isValid,
        formatted: isValid ? `${body}-${dv}` : rut
    };
}

/** @param {string} email @returns {boolean} */
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Valida campos de autenticación (registro y login).
 * - RUT: solo se valida si viene en el body (opcional en login).
 * - Email: requerido, formato válido.
 * - Password: mín. 6 caracteres, al menos 1 mayúscula, 1 minúscula y 1 dígito.
 *
 * Efecto secundario: si el RUT es válido, body.dni se reemplaza con el formato normalizado.
 * @param {Object} body - req.body de la petición.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateAuthBody(body) {
    const errors = [];

    if (body.dni) {
        const rutResult = validateAndFormatRut(body.dni);
        if (!rutResult.isValid) {
            errors.push('El DNI (RUT) no es válido.');
        } else {
            body.dni = rutResult.formatted;
        }
    }

    if (!body.email || typeof body.email !== 'string') {
        errors.push('Email es requerido.');
    } else if (!isValidEmail(body.email)) {
        errors.push('Formato de email inválido.');
    }

    if (!body.password || typeof body.password !== 'string') {
        errors.push('Password es requerido.');
    } else if (body.password.length < 6) {
        errors.push('Password debe tener al menos 6 caracteres.');
    } else {
        if (!/[A-Z]/.test(body.password) || !/[a-z]/.test(body.password) || !/\d/.test(body.password)) {
            errors.push('Password debe contener al menos una letra mayúscula, una letra minúscula y un dígito.');
        }
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Valida los campos requeridos de una solicitud de viaje.
 * Efecto secundario: normaliza body.dni si el RUT es válido.
 * @param {Object} body - req.body de la petición.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateRequestBody(body) {
    const errors = [];

    const rutResult = validateAndFormatRut(body.dni);
    if (!rutResult.isValid) {
        errors.push('RUT del pasajero inválido.');
    } else {
        body.dni = rutResult.formatted;
    }

    if (!body.passengerName) errors.push('El nombre del pasajero es requerido.');
    if (!body.origin) errors.push('El origen es requerido.');
    if (!body.destination) errors.push('El destino es requerido.');
    if (!body.departureDate) errors.push('La fecha de salida es requerida.');
    if (!body.linkedUserId) errors.push('Debe asociar la solicitud a un cliente registrado.');

    return { isValid: errors.length === 0, errors };
}

module.exports = {
    validateRegisterBody: validateAuthBody,
    validateLoginBody: validateAuthBody,
    validateRequestBody,
    validateAndFormatRut
};