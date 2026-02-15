const fs = require('fs/promises');
const path = require('path');

// Esta función base nos permite leer cualquier archivo en la carpeta /data
const getFilePath = (fileName) => path.join(__dirname, '..', 'data', fileName);

const readJSON = async (fileName) => {
  try {
    const filePath = getFilePath(fileName);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe, retornamos un arreglo vacío en lugar de romper la app
    if (error.code === 'ENOENT') {
      // Creamos el archivo si no existe para evitar errores futuros
      await writeJSON(fileName, []);
      return [];
    }
    throw error;
  }
};

const writeJSON = async (fileName, data) => {
  const filePath = getFilePath(fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

module.exports = { readJSON, writeJSON };