const { v4: uuidv4 } = require('uuid'); 
const { readJSON, writeJSON } = require('../utils/jsonStorage');

const FILE_NAME = 'requests.json';

// Simula una espera de red (Latencia)
const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRequests = async (req, res) => {
  try {
    // 1. Simulamos la espera de 3 segundos requerida en la pauta
    await simulateDelay(3000);

    const requests = await readJSON(FILE_NAME);
    
    // 2. Filtramos: Un usuario solo debe ver SUS solicitudes
    
    const userRequests = requests.filter(r => r.userId === req.user.userId);

    res.json(userRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las solicitudes." });
  }
};

const createRequest = async (req, res) => {
  try {
    const { destination, date, status } = req.body;

    // Validación básica
    if (!destination || !date) {
      return res.status(400).json({ message: "Destino y fecha son obligatorios." });
    }

    const requests = await readJSON(FILE_NAME);

    const newRequest = {
      id: uuidv4(),
      userId: req.user.userId, // Vinculamos la solicitud al usuario logueado
      destination,
      date,
      status: status || 'pending', // Estado por defecto
      createdAt: new Date().toISOString()
    };

    requests.push(newRequest);
    await writeJSON(FILE_NAME, requests);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la solicitud." });
  }
};

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const requests = await readJSON(FILE_NAME);
        
        // Filtramos para eliminar la que coincida con el ID y pertenezca al usuario
        const updatedRequests = requests.filter(
            r => r.id !== id || r.userId !== req.user.userId
        );

        if (requests.length === updatedRequests.length) {
            return res.status(404).json({ message: "Solicitud no encontrada o no autorizada." });
        }

        await writeJSON(FILE_NAME, updatedRequests);
        res.json({ message: "Solicitud eliminada correctamente." });

    } catch (error) {
        res.status(500).json({ message: "Error al eliminar." });
    }
}

const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { destination, date, status } = req.body;

        const requests = await readJSON(FILE_NAME);
        
        // Buscamos el índice de la solicitud
        const index = requests.findIndex(r => r.id === id);

        // Validamos si existe
        if (index === -1) {
            return res.status(404).json({ message: "Solicitud no encontrada." });
        }

        // Validamos seguridad: ¿Pertenece al usuario logueado?
        if (requests[index].userId !== req.user.userId) {
            return res.status(403).json({ message: "No tienes permiso para editar esta solicitud." });
        }

        // Actualizamos los datos (mantenemos los anteriores si no vienen en el body)
        requests[index] = {
            ...requests[index], // Copia todo lo que había
            destination: destination || requests[index].destination,
            date: date || requests[index].date,
            status: status || requests[index].status
        };

        await writeJSON(FILE_NAME, requests);

        res.json(requests[index]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar la solicitud." });
    }
};

module.exports = { getRequests, createRequest, deleteRequest, updateRequest };