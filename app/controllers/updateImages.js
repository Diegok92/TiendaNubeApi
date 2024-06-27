const fs = require("fs");
const csv = require("csv-parser");
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

const updateImages = async (req, res) => {
  try {
    const access_token = req.query.access_token;
    const user_id = req.query.user_id;

    // Leer información de las nuevas imágenes
    const imagesData = await readCsvFile(
      "app/assets/documents/EXXIT_Imagenes.csv"
    );

    // Procesar cada imagen para actualizar en los productos
    const startTime = performance.now();

    for (const imageData of imagesData) {
      const productId = imageData.ID;
      const sku = imageData.SKU;
      const newImageSrc = imageData.Imagen;

      const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${productId}/images`;

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authentication: `bearer ${access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Error en la solicitud: ${response.status} - ${response.statusText}`
          );
        }

        const images = await response.json();
        const imageToUpdate = images.find((image) => image.position === 1); // Suponiendo que la imagen a actualizar siempre esté en la posición 1

        if (imageToUpdate) {
          const updatedImage = {
            id: imageToUpdate.id,
            src: newImageSrc,
            position: 1,
            product_id: productId,
          };

          const updateResponse = await fetch(`${endpoint}/${updatedImage.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authentication: `bearer ${access_token}`,
            },
            body: JSON.stringify(updatedImage),
          });

          if (!updateResponse.ok) {
            throw new Error(
              `Error en la solicitud: ${updateResponse.status} - ${updateResponse.statusText}`
            );
          }

          console.log(
            `Imagen del producto ${productId} actualizada correctamente.`
          );
        } else {
          console.log(
            `No se encontró una imagen para el producto ${productId}.`
          );
        }
      } catch (error) {
        console.error(
          `Error al actualizar la imagen del producto ${productId}:`,
          error
        );
      }
    }

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    console.log(`Tiempo total de actualización de imágenes: ${elapsedTime} ms`);

    res.status(200).json({ message: "Imágenes actualizadas correctamente." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Ocurrió un error inesperado." });
  }
};

module.exports = { updateImages };
