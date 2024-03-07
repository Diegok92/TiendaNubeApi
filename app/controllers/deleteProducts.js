const fs = require("fs");
const csv = require("csv-parser");

const deleteProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const productIds = [];

  fs.createReadStream("app/assets/documents/Productos.csv")
    .pipe(csv({ separator: ";" })) // Establecer el separador como ';'
    .on("data", (data) => {
      if (data.ID) {
        // Usar 'ID' como clave para acceder al ID del producto
        productIds.push(data.ID);
      }
    })
    .on("end", () => {
      deleteProductsRecursive(0, productIds, user_id, access_token, res);
    });
};

function deleteProductsRecursive(
  index,
  productIds,
  user_id,
  access_token,
  res
) {
  if (index < productIds.length) {
    const productId = productIds[index];
    const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${productId}`;

    fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authentication: `bearer ${access_token}`,
      },
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
        console.log(`Producto ${productId} eliminado exitosamente`);
        deleteProductsRecursive(
          index + 1,
          productIds,
          user_id,
          access_token,
          res
        );
      })
      .catch((error) => console.error(error));
  } else {
    res.send("Eliminación de productos completada");
  }
}

module.exports = { deleteProducts };
