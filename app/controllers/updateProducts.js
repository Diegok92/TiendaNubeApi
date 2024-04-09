const fs = require("fs");
const csv = require("csv-parser");
const { createObjectCsvWriter } = require("csv-writer");
const { performance } = require("perf_hooks");

const readCsvFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    const productos = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data) => {
        productos.push(data);
      })
      .on("end", () => {
        resolve(productos);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const updateProducts = async (req, res) => {
  try {
    const access_token = req.query.access_token;
    const user_id = req.query.user_id;

    // Objeto para almacenar los productos ya publicados con SKU como clave
    const productosPublicados = {};

    // Leer el archivo CSV de productos ya publicados y almacenarlos en el objeto
    fs.createReadStream("app/assets/documents/Productos.csv")
      .pipe(csv({ separator: ";" }))
      .on("data", (data) => {
        productosPublicados[data.SKU] = data;
      })
      .on("end", async () => {
        // Leer el archivo CSV de nuevos productos y realizar la comparación
        const nuevosProductos = await readCsvFile(
          "app/assets/documents/nuevosProductos.csv"
        );
        const productosParaActualizar = [];

        for (const producto of nuevosProductos) {
          const productoPublicado = productosPublicados[producto.SKU];
          if (productoPublicado) {
            producto.ID = productoPublicado.ID;
            producto.VARIANT_ID = productoPublicado.VARIANT_ID;
            productosParaActualizar.push(producto);
          }
        }

        // Escribir los productos para actualizar en un nuevo archivo CSV
        const csvWriter = createObjectCsvWriter({
          path: "app/assets/documents/actualizarInfoCompleta.csv",
          header: [
            { id: "ID", title: "ID" },
            { id: "SKU", title: "SKU" },
            { id: "VARIANT_ID", title: "VARIANT_ID" },
            { id: "CATEGORIES", title: "CATEGORIES" },
            { id: "NAME", title: "NAME" },
            { id: "PRICE", title: "PRICE" },
            { id: "PROMOTIONAL_PRICE", title: "PROMOTIONAL_PRICE" },
            { id: "STOCK", title: "STOCK" },
            { id: "DESCRIPTION", title: "DESCRIPTION" },
          ],
          fieldDelimiter: ";",
        });

        await csvWriter.writeRecords(productosParaActualizar);

        // Una vez que se ha escrito el archivo actualizarInfoCompleta.csv, procedemos a actualizar los productos
        const productosActualizados = await readCsvFile(
          "app/assets/documents/actualizarInfoCompleta.csv"
        );

        const csvStartTime = new Date();
        const requestStartTime = performance.now();

        // Procesar cada producto para actualizar
        for (const producto of productosActualizados) {
          const productId = producto.ID;
          const variantId = producto.VARIANT_ID;
          const updatedPrice = parseFloat(producto.PRICE);
          const updatedPromotional_Price = parseFloat(
            producto.PROMOTIONAL_PRICE
          );
          const updatedStock = parseInt(producto.STOCK);

          const body = {
            price: updatedPrice,
            promotional_price: updatedPromotional_Price,
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

        // Eliminar el contenido del archivo actualizarInfoCompleta.csv
        fs.writeFile(
          "app/assets/documents/actualizarInfoCompleta.csv",
          "",
          (error) => {
            if (error) {
              console.error(
                "Error al eliminar el contenido del archivo:",
                error
              );
            } else {
              console.log(
                "El contenido del archivo actualizarInfoCompleta.csv se ha eliminado correctamente."
              );
            }
          }
        );

        res
          .status(200)
          .json({ message: "Productos actualizados correctamente." });
      })
      .on("error", (error) => {
        console.error("Error al leer el archivo CSV de productos:", error);
        res.status(500).json({
          error: "Ocurrió un error al leer el archivo CSV de productos.",
        });
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
