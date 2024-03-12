const fs = require("fs");
const csv = require("csv-parser");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteProducts = async (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const productIds = [];

  console.time("Tiempo de eliminación de productos"); // Iniciar la medición del tiempo

  fs.createReadStream("app/assets/documents/Productos.csv")
    .pipe(csv({ separator: ";" })) // Establecer el separador como ';'
    .on("data", (data) => {
      if (data.ID) {
        // Usar 'ID' como clave para acceder al ID del producto
        productIds.push(data.ID);
      }
    })
    .on("end", async () => {
      try {
        await deleteProductsSequential(productIds, user_id, access_token);
        console.timeEnd("Tiempo de eliminación de productos"); // Finalizar la medición del tiempo
        res.send("Eliminación de productos completada");
      } catch (error) {
        console.error("Error al eliminar los productos:", error);
        res.status(500).send("Error al eliminar los productos");
      }
    });
};

const deleteProductsSequential = async (productIds, user_id, access_token) => {
  for (const productId of productIds) {
    await deleteProduct(productId, user_id, access_token);
    await wait(1000); // Esperar 1 segundo entre cada solicitud (ajusta este valor según sea necesario)
  }
};

const deleteProduct = async (productId, user_id, access_token) => {
  const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${productId}`;

  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authentication: `bearer ${access_token}`,
      },
    });

    if (!response.ok) {
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
    throw new Error(`Error al eliminar el producto ${productId}: ${error}`);
  }
};

module.exports = { deleteProducts };
