// Función para validar y formatear RUT Chileno
function validateAndFormatRut(rut) {
    if (!rut || typeof rut !== 'string') return { isValid: false, formatted: rut };

    // 1. Limpiar absolutamente todo (puntos, guiones, espacios)
    let cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (cleanRut.length < 8) return { isValid: false, formatted: rut };

    // 2. Separar cuerpo y dígito verificador
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);

    // 3. Algoritmo Módulo 11
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    const dvCalc = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

    const isValid = dv === dvCalc;
    
    // 4. Retornar el RUT formateado (sin puntos, con guion)
    return {
        isValid,
        formatted: isValid ? `${body}-${dv}` : rut
    };
}

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Validación para Registro y Login
function validateAuthBody(body) {
    const errors = [];

    // 1. Validación de RUT (Solo si viene en el body, ej: Registro)
    if (body.dni) {
        const rutResult = validateAndFormatRut(body.dni);
        if (!rutResult.isValid) {
            errors.push('El DNI (RUT) no es válido.');
        } else {
            body.dni = rutResult.formatted; // Formateo automático
        }
    }

    // 2. Validación de Email
    if (!body.email || typeof body.email !== 'string') {
        errors.push('Email es requerido.');
    } else if (!isValidEmail(body.email)) {
        errors.push('Formato de email inválido.');
    }

    // 3. Validación de Password (Mínimo 6 caracteres, Mayúscula, Minúscula y Dígito)
    if (!body.password || typeof body.password !== 'string') {
        errors.push('Password es requerido.');
    } else if (body.password.length < 6) {
        errors.push('Password debe tener al menos 6 caracteres.');
    } else {
        const hasUpperCase = /[A-Z]/.test(body.password);
        const hasLowerCase = /[a-z]/.test(body.password);
        const hasDigit = /\d/.test(body.password);
        
        if (!hasUpperCase || !hasLowerCase || !hasDigit) {
            errors.push('Password debe contener al menos una letra mayúscula, una letra minúscula y un dígito.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Validación específica para el formulario de Solicitud de Viaje
function validateRequestBody(body) {
    const errors = [];
    
    // Validar y formatear RUT del pasajero
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

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateRegisterBody: validateAuthBody,
    validateLoginBody: validateAuthBody,
    validateRequestBody,
    validateAndFormatRut
};