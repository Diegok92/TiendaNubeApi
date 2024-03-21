const updateProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;

  // Información del producto a actualizar
  const productId = "205368360";
  const variantId = "856784324";
  const updatedPrice = 10000;
  const updatedStock = 1;

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
      res.status(200).json({ message: "Producto actualizado correctamente." });
    })
    .catch((error) => {
      console.error(error);
      res
        .status(500)
        .json({ error: "Ocurrió un error al actualizar el producto." });
    });
};

module.exports = { updateProducts };
