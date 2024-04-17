const fs = require("fs");
const csv = require("csv-parser");
const { createObjectCsvWriter } = require("csv-writer");
const { performance } = require("perf_hooks");

const updateProducts = async (req, res) => {
  try {
    const access_token = req.query.access_token;
    const user_id = req.query.user_id;

    const productosActualizados = [];

    // Leer el archivo CSV de actualización
    fs.createReadStream("app/assets/documents/actualizarInfoCompleta.csv")
      .pipe(csv({ separator: ";" }))
      .on("data", (data) => {
        productosActualizados.push(data);
      })
      .on("end", async () => {
        const csvStartTime = new Date();
        const requestStartTime = performance.now();

        // Procesar cada producto para actualizar
        for (const producto of productosActualizados) {
          const productId = producto.ID;
          const variantId = producto.VARIANT_ID;
          const updatedPrice = parseFloat(producto.PRICE);
          const updatedStock = parseInt(producto.STOCK);

          const body = {
            price: updatedPrice,
            stock: updatedStock,
          };

          const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${productId}/variants/${variantId}`;

          try {
            let response = await fetchWithRetry(endpoint, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authentication: `bearer ${access_token}`,
              },
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              throw new Error(
                `Error en la solicitud: ${response.status} - ${response.statusText}`
              );
            }

            console.log(`Producto ${productId} actualizado correctamente.`);
          } catch (error) {
            console.error(
              `Error al actualizar el producto ${productId}:`,
              error
            );
          }
        }

        const requestEndTime = performance.now();
        const requestElapsedTime = requestEndTime - requestStartTime;

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
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Ocurrió un error inesperado." });
  }
};

// Función para realizar una solicitud con reintento en caso de error 429
const fetchWithRetry = async (url, options, retryDelay = 1000) => {
  let response;
  while (true) {
    response = await fetch(url, options);
    if (response.status !== 429) {
      break;
    }
    const rateLimitReset = parseInt(response.headers.get("X-Rate-Limit-Reset"));
    const timeToWait = Math.max(rateLimitReset - Date.now(), retryDelay);
    console.log(
      `Esperando ${timeToWait} milisegundos antes de volver a intentarlo...`
    );
    await new Promise((resolve) => setTimeout(resolve, timeToWait));
  }
  return response;
};

module.exports = { updateProducts };
