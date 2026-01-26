require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/auth", require("./routes/auth.routes"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: "error", 
    message: "Internal Server Error" ,
    time: new Date().toISOString(),
    task_id: require('uuid').v4()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
} );