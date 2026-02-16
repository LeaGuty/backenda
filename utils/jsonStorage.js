/**
 * @file jsonStorage.js - Lectura y escritura asíncrona de archivos JSON en /data.
 * Si el archivo no existe al leer, se crea automáticamente con un arreglo vacío.
 */
const fs = require('fs/promises');
const path = require('path');

const getFilePath = (fileName) => path.join(__dirname, '..', 'data', fileName);

/**
 * Lee y parsea un archivo JSON de /data.
 * @param {string} fileName - Nombre del archivo (ej: "users.json").
 * @returns {Promise<Array>} Contenido del archivo o [] si no existe.
 */
const readJSON = async (fileName) => {
  try {
    const filePath = getFilePath(fileName);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeJSON(fileName, []);
      return [];
    }
    throw error;
  }
};

/**
 * Escribe datos como JSON formateado en /data.
 * @param {string} fileName - Nombre del archivo.
 * @param {*} data - Datos a serializar.
 */
const writeJSON = async (fileName, data) => {
  const filePath = getFilePath(fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

module.exports = { readJSON, writeJSON };