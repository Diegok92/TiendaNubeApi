const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fileExists = fs.existsSync("SKUs.csv");
const csvWriter = createCsvWriter({
  path: "app/assets/documents/SKUs.csv", // Nombre del archivo de salida
  header: [
    { id: "id_interno", title: "ID_INTERNO" },
    { id: "id", title: "ID" },
    { id: "sku", title: "SKU" },
  ],
  append: fileExists, // Anexar a un archivo existente si es verdadero
  fieldDelimiter: ";",
});

const csv = require("csv-parser");

const getSKU = (req, res) => {
  // Define los parámetros necesarios para la solicitud
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const id_productos = [];

  fs.createReadStream("app/assets/documents/Productos.csv") // Cambia 'input.csv' al nombre de tu archivo CSV
    .pipe(csv({ separator: ";" })) // Asegúrate de usar el mismo delimitador que se usó al crear el CSV
    .on("data", (data) => id_productos.push(data.ID))
    .on("end", () => getProducts(id_productos[0], 0));

  function getProducts(id_producto, index) {
    const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${id_producto}/variants`;
    fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authentication: `bearer ${access_token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        //console.log(data);

        sku = data[0]?.sku ?? "no tiene";
        const json_data = [{ id_interno: index, id: id_producto, sku: sku }];

        // Escribir los datos en el archivo CSV
        csvWriter
          .writeRecords(json_data)
          .then(() => {})
          .catch((err) => {});

        if (index < id_productos.length) {
          index++;

          TIME_RANGE = index % 10 == 0 ? 1500 : 100;
          setTimeout(() => getProducts(id_productos[index], index), TIME_RANGE);
        } else {
          res.send("Proceso terminado, SKUs agregados al archivo CSV");
        }
      })
      .catch((error) => console.error(error));
  }
};

module.exports = { getSKU };
