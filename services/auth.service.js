const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');
const { readUsers, writeUsers } = require('../utils/sileStorage');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

async function registerUser(email, password) {
    const users = readUsers();
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        throw new Error('Usuario ya existe');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeUsers(users);
    return { id: newUser.id, email: newUser.email };
}
async function loginUser(email, password) {
    const users = readUsers();
    const user = users.find(user => user.email === email);
    if (!user) {
        throw new Error('Credenciales no válidas');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error('Credenciales no válidas');
    } 
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    return { token , userId: user.id, email: user.email }; 
}
function logoutUser() {
    // En una implementación basada en JWT, el logout se maneja en el cliente
    return true;
}
function getUserById(id) {
    const users = readUsers();
    const user = users.find(user => user.id === id);
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    return { id: user.id, email: user.email , createdAt: user.createdAt};
}
module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserById
};