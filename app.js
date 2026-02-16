/**
 * @file app.js - Punto de entrada del servidor Express.
 * Configura middlewares globales, rutas y manejo de errores.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.routes");
const requestRoutes = require('./routes/request.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globales de seguridad, logging y parsing
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use('/api/requests', requestRoutes);

// Manejador global de errores no capturados
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
    time: new Date().toISOString(),
    task_id: require('uuid').v4()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});