function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Función genérica que centraliza la lógica de validación
function validateAuthBody(body) {
    const errors = [];

    // Validación de Email
    if (!body.email || typeof body.email !== 'string') {
        errors.push('Email es requerido y debe ser una cadena de texto.');
    } else if (!isValidEmail(body.email)) {
        errors.push('Formato de email inválido.');
    }

    // Validación de Password
    if (!body.password || typeof body.password !== 'string') {
        errors.push('Password es requerido y debe ser una cadena de texto.');
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

// Exportamos la misma lógica con nombres descriptivos para mantener la compatibilidad
module.exports = {
    validateRegisterBody: validateAuthBody,
    validateLoginBody: validateAuthBody
};