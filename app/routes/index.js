const express = require("express");
const router = express.Router();
const fs = require("fs");
const pathRouter = `${__dirname}`; //Hace referencia a éste directorio

// Ésta funcion elimina el '.js' de los archivos que estén dentro de éste directorio
const removeExtension = (fileName) => {
  // Ejemplo: users.js --> [users, js]. Shift() elimina la extención.
  return fileName.split(".").shift();
};

// Listo los archivos dentro de éste directorio y a cada uno le quito la extención (.js)
fs.readdirSync(pathRouter).filter((file) => {
  const path = removeExtension(file); // path es el archivo, el nombre sin extención.
  const skip = ["index"].includes(path); // Ignoro el index.js

  if (!skip) {
    router.use(`/${path}`, require(`./${file}`));
    console.log("CARGAR RUTA---->", removeExtension(file));
  }
});

router.get("*", (req, res) => {
  res.status(404);
  res.send({ error: "Not Found" });
});
module.exports = router;
