/**
 * @file request.controller.js - CRUD de solicitudes de viaje.
 * Los agentes ven todas las solicitudes; los clientes solo las propias.
 */
const { readJSON, writeJSON } = require('../utils/jsonStorage');

const FILE_NAME = 'requests.json';

/** GET / - Retorna solicitudes filtradas según el rol del usuario autenticado. */
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await readJSON(FILE_NAME);
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (user.role === 'agent') {
      return res.json(requests);
    }

    const myRequests = requests.filter(r => r.linkedUserId === user.id);
    return res.json(myRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las solicitudes' });
  }
};

/** POST / - Crea una nueva solicitud con ID auto-incremental. */
exports.createRequest = async (req, res) => {
  try {
    const {
      dni, passengerName, origin, destination, tripType,
      linkedUserId, linkedUserName, departureDate, returnDate, status
    } = req.body;

    const requests = await readJSON(FILE_NAME);

    // IDs no numéricos (legacy) se ignoran para no romper el cálculo del máximo
    const maxId = requests.reduce((max, req) => {
      const currentId = parseInt(req.id);
      return (!isNaN(currentId) && currentId > max) ? currentId : max;
    }, 1117);

    const newId = (maxId + 1).toString();

    const now = new Date();
    const registrationDate = now.toLocaleDateString('es-CL') + ' ' + now.toLocaleTimeString('es-CL');

    const newRequest = {
      id: newId,
      dni,
      passengerName,
      origin,
      destination,
      tripType,
      linkedUserId,
      linkedUserName,
      departureDate,
      returnDate,
      registrationDate,
      status: status || 'pendiente'
    };

    requests.push(newRequest);
    await writeJSON(FILE_NAME, requests);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la solicitud' });
  }
};

/** DELETE /:id - Elimina una solicitud por su ID. */
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const requests = await readJSON(FILE_NAME);

    const filteredRequests = requests.filter(r => r.id !== id);

    if (requests.length === filteredRequests.length) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    await writeJSON(FILE_NAME, filteredRequests);
    res.json({ message: 'Solicitud eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la solicitud' });
  }
};

/** PUT /:id - Actualiza una solicitud preservando ID y fecha de registro. */
exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const requests = await readJSON(FILE_NAME);

    const index = requests.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Sobrescribir id y registrationDate para que no se alteren desde el body
    const updatedRequest = {
      ...requests[index],
      ...updateData,
      id: requests[index].id,
      registrationDate: requests[index].registrationDate
    };

    requests[index] = updatedRequest;
    await writeJSON(FILE_NAME, requests);

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la solicitud' });
  }
};