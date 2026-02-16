const authService = require('../services/auth.service');

async function register(req, res) {
  try {
    const userData = req.body;
    const user = await authService.register(userData);
    res.status(201).json({ message: 'Usuario registrado exitosamente', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    res.json({ message: 'Login exitoso', user, token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// Nueva función para obtener clientes
async function getClients(req, res) {
  try {
    const clients = await authService.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error al obtener la lista de clientes' });
  }
}

// Exportamos todo junto al final para evitar errores
module.exports = {
  register,
  login,
  getClients
};