const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fileExists = fs.existsSync("Productos.csv");
const csvWriter = createCsvWriter({
  path: "app/assets/documents/Productos.csv", // Nombre del archivo de salida
  header: [
    { id: "id", title: "ID" },
    { id: "name", title: "NAME" },
    { id: "canonical_url", title: "CANONICAL_URL" },
    { id: "published", title: "PUBLISHED" },
    { id: "price", title: "PRICE" },
  ],
  append: fileExists, // Anexar a un archivo existente si es verdadero
  fieldDelimiter: ";",
});
let page = 1;

const getProducts = (req, res) => {
  // Define los parámetros necesarios para la solicitud
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;

  const endpoint = `https://api.tiendanube.com/v1/${user_id}/products`;

  fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authentication: `bearer ${access_token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // Prueba de guardar csv
      // Verificar si el archivo CSV ya existe

      const json_data = [];
      //console.log(data);

      data.forEach((row) => {
        if (row.published == true) {
          json_data.push({
            id: row.id,
            name: row.name.es,
            canonical_url: row.canonical_url,
            published: row.published,
            price: row.variants[0].price,
          });
        }
      });

      // Escribir los datos en el archivo CSV
      // console.log(json_data);

      csvWriter
        .writeRecords(json_data)
        .then(() => {})
        .catch((err) => {});

      res.send("termino de ejecutar getProducts");
    })
    .catch((error) => console.error(error));
};
module.exports = { getProducts };
