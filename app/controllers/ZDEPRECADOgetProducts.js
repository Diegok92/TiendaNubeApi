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
  ],
  append: fileExists, // Anexar a un archivo existente si es verdadero
  fieldDelimiter: ";",
});
let page = 1;

const getProducts = (req, res) => {
  // Define los parámetros necesarios para la solicitud
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  getProductsPage(page);

  function getProductsPage(page) {
    const endpoint = `https://api.tiendanube.com/v1/${user_id}/products?page=${page}&per_page=200&fields=id,name,canonical_url,description,published`;
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

        /*
        data.forEach((row) => {
          if (row.published == true) {
            json_data.push({
              id: row.id,
              name: row.name.es,
              canonical_url: row.canonical_url,
              published: row.published,
            });
          }
        });

        */

        // Escribir los datos en el archivo CSV
        console.log(json_data[0]);

        csvWriter
          .writeRecords(json_data)
          .then(() => {})
          .catch((err) => {});

        if (page <= 123) {
          page++;
          console.log(page);
          getProductsPage(page);
        } else {
          res.send("Proceso terminado");
        }
      })
      .catch((error) => console.error(error));
  }
};
module.exports = { getProducts };
