/**
 * @file auth.controller.js - Controladores de autenticación.
 * Maneja registro, login y consulta de clientes.
 */
const authService = require('../services/auth.service');

/** @param {import('express').Request} req @param {import('express').Response} res */
async function register(req, res) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'Usuario registrado exitosamente', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    res.json({ message: 'Login exitoso', user, token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
async function getClients(req, res) {
  try {
    const clients = await authService.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error al obtener la lista de clientes' });
  }
}

module.exports = {
  register,
  login,
  getClients
};