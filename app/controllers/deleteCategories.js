const fs = require("fs");
const csv = require("csv-parser");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteCategories = async (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const categoryIds = [];

  console.time("Tiempo de eliminación de categorías"); // Iniciar la medición del tiempo

  fs.createReadStream("app/assets/documents/categorias.csv")
    .pipe(csv({ separator: ";" })) // Establecer el separador como ';'
    .on("data", (data) => {
      if (data.CATEGORY_ID) {
        // Usar 'CATEGORY_ID' como clave para acceder al ID de la categoría
        categoryIds.push(data.CATEGORY_ID);
      }
    })
    .on("end", async () => {
      try {
        await deleteCategoriesSequential(categoryIds, user_id, access_token);
        console.timeEnd("Tiempo de eliminación de categorías"); // Finalizar la medición del tiempo
        await clearCategoriesFile(); // Limpiar el archivo de categorías después de borrar las categorías
        res.send("Eliminación de categorías completada");
      } catch (error) {
        console.error("Error al eliminar las categorías:", error);
        res.status(500).send("Error al eliminar las categorías");
      }
    });
};

const deleteCategoriesSequential = async (
  categoryIds,
  user_id,
  access_token
) => {
  for (const categoryId of categoryIds) {
    console.log(`Borrando categoría con ID: ${categoryId}`);
    await deleteCategory(categoryId, user_id, access_token);
    await wait(1000); // Esperar 1 segundo entre cada solicitud (ajusta este valor según sea necesario)
  }
};

const deleteCategory = async (categoryId, user_id, access_token) => {
  const endpoint = `https://api.tiendanube.com/v1/${user_id}/categories/${categoryId}`;

  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authentication: `bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        //console.warn(`La categoría ${categoryId} no existe.`);
        return; // No hace falta lanzar un error, simplemente salir de la función
      }
      console.error(
        "Error en la solicitud:",
        response.status,
        response.statusText
      );
      const text = await response.text();
      console.error("Detalles del error:", text);
      throw new Error(
        `Error en la solicitud: ${response.status} - ${response.statusText}`
      );
    }
  } catch (error) {
    throw new Error(`Error al eliminar la categoría ${categoryId}: ${error}`);
  }
};

const clearCategoriesFile = async () => {
  const file = "app/assets/documents/categorias.csv";

  // Leer la primera línea del archivo
  let firstLine = null;
  const readableStream = fs.createReadStream(file);
  readableStream
    .on("data", (chunk) => {
      const lines = chunk.toString().split("\n");
      firstLine = lines[0];
      readableStream.destroy(); // Detener la lectura después de obtener la primera línea
    })
    .on("error", (err) => {
      console.error("Error al leer el archivo:", err);
      throw err;
    })
    .on("close", () => {
      // Reescribir el archivo con la primera línea
      fs.writeFile(file, firstLine, (err) => {
        if (err) {
          console.error("Error al limpiar el archivo de categorías:", err);
          throw err;
        }
        console.log("Contenido del archivo de categorías limpiado con éxito");
      });
    });
};

module.exports = { deleteCategories };
