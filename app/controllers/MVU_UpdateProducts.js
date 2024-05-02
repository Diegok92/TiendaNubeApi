const fs = require("fs");
const csv = require("csv-parser");
const { createObjectCsvWriter } = require("csv-writer");
const { performance } = require("perf_hooks");

const readCsvFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data) => {
        rows.push(data);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const MVU_UpdateProducts = async (req, res) => {
  try {
    const access_token = req.query.access_token;
    const user_id = req.query.user_id;

    // Leer información de las variantes de los productos
    const variantsData = await readCsvFile("app/assets/documents/variants.csv");

    // Objeto para almacenar las variantes ya publicadas con SKU como clave
    const variantsMap = {};
    variantsData.forEach((variant) => {
      variantsMap[variant.SKU] = variant;
    });

    // Leer el archivo CSV de nuevos productos y realizar la comparación
    const newProducts = await readCsvFile(
      "app/assets/documents/nuevosProductos.csv"
    );
    const productsToUpdate = [];

    for (const newProduct of newProducts) {
      const variant = variantsMap[newProduct.SKU];
      if (variant) {
        productsToUpdate.push({
          PRODUCT_ID: variant.PRODUCT_ID,
          SKU: variant.SKU,
          VARIANT_ID: variant.VARIANT_ID,
          PRICE: newProduct.PRICE,
          PROMOTIONAL_PRICE: newProduct.PROMOTIONAL_PRICE,
          STOCK: newProduct.STOCK,
        });
        // Eliminar la variante del mapa, ya que se ha encontrado en nuevosProductos.csv
        delete variantsMap[newProduct.SKU];
      }
    }

    // Escribir los productos para actualizar en un nuevo archivo CSV
    const csvWriter = createObjectCsvWriter({
      path: "app/assets/documents/actualizarInfoCompleta.csv",
      header: [
        { id: "PRODUCT_ID", title: "PRODUCT_ID" },
        { id: "SKU", title: "SKU" },
        { id: "VARIANT_ID", title: "VARIANT_ID" },
        { id: "PRICE", title: "PRICE" },
        { id: "PROMOTIONAL_PRICE", title: "PROMOTIONAL_PRICE" },
        { id: "STOCK", title: "STOCK" },
      ],
      fieldDelimiter: ";",
    });

    await csvWriter.writeRecords(productsToUpdate);

    // Actualizar los productos existentes en la tienda
    const productsToUpdateData = await readCsvFile(
      "app/assets/documents/actualizarInfoCompleta.csv"
    );

    const csvStartTime = new Date();
    const requestStartTime = performance.now();

    // Procesar cada producto para actualizar en la tienda
    for (const productToUpdate of productsToUpdateData) {
      const productId = productToUpdate.PRODUCT_ID;
      const variantId = productToUpdate.VARIANT_ID;
      const updatedPrice = parseFloat(productToUpdate.PRICE);
      const updatedPromotionalPrice = parseFloat(
        productToUpdate.PROMOTIONAL_PRICE
      );
      const updatedStock = parseInt(productToUpdate.STOCK);

      const body = {
        price: updatedPrice,
        promotional_price: updatedPromotionalPrice,
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
        console.error(`Error al actualizar el producto ${productId}:`, error);
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
          console.error("Error al eliminar el contenido del archivo:", error);
        } else {
          console.log(
            "El contenido del archivo actualizarInfoCompleta.csv se ha eliminado correctamente."
          );
        }
      }
    );

    res.status(200).json({ message: "Productos actualizados correctamente." });
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

module.exports = { MVU_UpdateProducts };
