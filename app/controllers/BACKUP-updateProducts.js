const fs = require("fs");
const csv = require("csv-parser");
const { createObjectCsvWriter } = require("csv-writer");
const { performance } = require("perf_hooks"); // Importa el módulo 'perf_hooks' para medir el rendimiento

const updateProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;

  const productosFile = fs.readFileSync(
    "app/assets/documents/Productos.csv",
    "utf8"
  );
  const nuevosProductosFile = fs.readFileSync(
    "app/assets/documents/nuevosProductos.csv",
    "utf8"
  );

  const productos = productosFile.split("\n").map((line) => line.split(";"));
  const nuevosProductos = nuevosProductosFile
    .split("\n")
    .map((line) => line.split(";"));

  const productosActualizados = [];

  for (const producto of productos) {
    const sku = producto[1];
    const nuevoProducto = nuevosProductos.find((item) => item[0] === sku);

    if (nuevoProducto) {
      const [id, name, price, stock, categories, description] = nuevoProducto;

      if (
        producto[4] !== name ||
        producto[5] !== price ||
        producto[6] !== stock ||
        producto[7] !== description
      ) {
        productosActualizados.push({
          ID: producto[0],
          SKU: producto[1],
          VARIANT_ID: producto[2],
          CATEGORIES: categories,
          NAME: name,
          PRICE: price,
          STOCK: stock,
          DESCRIPTION: description,
        });
      }
    }
  }

  const actCsvFilePath = "app/assets/documents/actualizarInfoCompleta.csv";
  const writeHeader = !fs.existsSync(actCsvFilePath);

  const csvWriter = createObjectCsvWriter({
    path: actCsvFilePath,
    header: [
      { id: "ID", title: "ID" },
      { id: "SKU", title: "SKU" },
      { id: "VARIANT_ID", title: "VARIANT_ID" },
      { id: "CATEGORIES", title: "CATEGORIES" },
      { id: "NAME", title: "NAME" },
      { id: "PRICE", title: "PRICE" },
      { id: "STOCK", title: "STOCK" },
      { id: "DESCRIPTION", title: "DESCRIPTION" },
    ],
    fieldDelimiter: ";",
    append: true,
    writeHeader: writeHeader,
  });

  csvWriter.writeRecords(productosActualizados).then(() => {
    console.log(
      "Se han actualizado los productos en actualizarInfoCompleta.csv"
    );

    const csvFilePath = actCsvFilePath;
    const csvStartTime = new Date();
    const requestStartTime = performance.now(); // Tiempo de inicio de las solicitudes HTTP

    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data) => {
        const productId = data.ID;
        const variantId = data.VARIANT_ID;
        const updatedPrice = parseFloat(data.PRICE);
        const updatedStock = parseInt(data.STOCK);

        const body = {
          price: updatedPrice,
          stock: updatedStock,
        };

        const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${productId}/variants/${variantId}`;

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
            //console.log(`Producto ${productId} actualizado correctamente.`);
          })
          .catch((error) => {
            console.error(
              `Error al actualizar el producto ${productId}:`,
              error
            );
          });
      })
      .on("end", () => {
        const requestEndTime = performance.now(); // Tiempo de finalización de las solicitudes HTTP
        const requestElapsedTime = requestEndTime - requestStartTime; // Calcula el tiempo total de las solicitudes HTTP

        console.log(
          `Tiempo total de actualización de productos: ${requestElapsedTime} ms`
        );

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
  });
};

module.exports = { updateProducts };
