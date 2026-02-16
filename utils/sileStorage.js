/**
 * @file sileStorage.js - Lectura/escritura síncrona de users.json.
 * @deprecated Usar jsonStorage.js (asíncrono) en su lugar.
 */
const fs = require('fs');
const path = require('path');

const USER_FILE = path.join(__dirname, '..', 'data', 'users.json');

/** @deprecated Usar readJSON('users.json') de jsonStorage.js. */
function readUsers() {
    try {
        const data = fs.readFileSync(USER_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading users file:', err);
        return [];
    }
}

/** @deprecated Usar writeJSON('users.json', data) de jsonStorage.js. */
function writeUsers(users) {
    try {
        fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing users file:', err);
        throw new Error('Could not write users file');
    }
}

module.exports = {
    readUsers,
    writeUsers
};