const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
//const fetch = require("node-fetch");

const getCategories = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const startTime = new Date();

  const endpoint = `https://api.tiendanube.com/v1/${user_id}/categories`;

  fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authentication: `bearer ${access_token}`, // Corregido el nombre del encabezado de autenticación
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Error al obtener las categorías: ${response.status} - ${response.statusText}`
        );
      }
      return response.json();
    })
    .then((data) => {
      //console.log(data);

      // Verifica si data es un array
      if (Array.isArray(data)) {
        const categories = data.map((category) => ({
          category_id: category.id,
          name: category.name.es, // Ajusta el idioma según corresponda
          parent_id: category.parent,
          subcategories: category.subcategories.join(","),
        }));

        // Especifica la ruta y las columnas del archivo CSV
        const csvWriter = createCsvWriter({
          path: "app/assets/documents/categorias.csv",
          header: [
            { id: "category_id", title: "CATEGORY_ID" },
            { id: "name", title: "NAME" },
            { id: "parent_id", title: "PARENT_ID" },
            { id: "subcategories", title: "SUBCATEGORIES" },
          ],
          fieldDelimiter: ";",
        });

        // Escribe los datos en el archivo CSV
        csvWriter
          .writeRecords(categories)
          .then(() => {
            const endTime = new Date();
            const elapsedTime = endTime - startTime;
            console.log(`Tiempo de guardado en CSV: ${elapsedTime} ms`);
            console.log("Categorías guardadas en categorias.csv");
            res.status(200).send("Categorías guardadas en categorias.csv");
          })
          .catch((error) => {
            console.error("Error al escribir en el archivo CSV:", error);
            res.status(500).send("Error al guardar las categorías");
          });
      } else {
        throw new Error("La respuesta no es un array");
      }
    })
    .catch((error) => {
      console.error("Error al obtener las categorías:", error.message);
      res.status(500).send("Error al obtener las categorías");
    });
};

module.exports = { getCategories };
