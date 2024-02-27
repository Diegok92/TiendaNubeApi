require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();

// Express
app.use(express.json());
app.use("/", require(path.join(__dirname, "app/routes")));

// Server
app.listen(process.env.PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${process.env.PORT}/login`);
});

module.exports = app;
