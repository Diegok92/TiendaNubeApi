const fs = require("fs");
const csv = require("csv-parser");

const updateProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;

  // Archivo CSV que contiene la información de los productos a actualizar
  const csvFilePath = "app/assets/documents/actualizarInfoCompleta.csv";

  // Tiempo de inicio para la lectura del archivo CSV
  const csvStartTime = new Date();

  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: ";" }))
    .on("data", (data) => {
      // Obtener la información del producto a partir de cada fila del CSV
      const productId = data.ID;
      const variantId = data.VARIANTID;
      const updatedPrice = parseFloat(data.PRICE); // Asegurar que el precio sea un número flotante
      const updatedStock = parseInt(data.STOCK); // Asegurar que el stock sea un número entero

      const body = {
        price: updatedPrice,
        stock: updatedStock,
      };

      const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${productId}/variants/${variantId}`;

      // Realizar la solicitud de actualización del producto
      fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authentication: `bearer ${access_token}`,
        },
        body: JSON.stringify(body),
      })
        .then((response) => {
          if (!response.ok) {
            console.error(
              "Error en la solicitud:",
              response.status,
              response.statusText
            );
            return response.text().then((text) => {
              console.error("Detalles del error:", text);
              throw new Error(
                `Error en la solicitud: ${response.status} - ${response.statusText}`
              );
            });
          }
          return response.json();
        })
        .then(() => {
          console.log(`Producto ${productId} actualizado correctamente.`);
        })
        .catch((error) => {
          console.error(`Error al actualizar el producto ${productId}:`, error);
        });
    })
    .on("end", () => {
      // Tiempo de finalización para la lectura del archivo CSV
      const csvEndTime = new Date();
      const csvElapsedTime = csvEndTime - csvStartTime;

      console.log(`Tiempo de lectura del archivo CSV: ${csvElapsedTime} ms`);

      res
        .status(200)
        .json({ message: "Productos actualizados correctamente." });
    })
    .on("error", (error) => {
      console.error("Error al leer el archivo CSV:", error);
      res
        .status(500)
        .json({ error: "Ocurrió un error al leer el archivo CSV." });
    });
};

module.exports = { updateProducts };
