const fs = require("fs");
const csv = require("csv-parser");

const updateProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;

  const newProducts = [];
  fs.createReadStream("app/assets/documents/nuevosProductos2.csv")
    .pipe(csv({ separator: ";" }))
    .on("data", (data) => {
      if (
        data.SKU &&
        data.NAME &&
        data.PRICE &&
        data.STOCK &&
        data.CATEGORIES &&
        data.DESCRIPTION
      ) {
        newProducts.push({
          sku: data.SKU,
          name: data.NAME,
          price: parseFloat(data.PRICE),
          stock: parseInt(data.STOCK),
          categories: data.CATEGORIES.split(",").map((category) =>
            parseInt(category.trim())
          ),
          description: data.DESCRIPTION,
        });
      }
    })
    .on("end", () => {
      const productsToUpdate = [];
      fs.createReadStream("app/assets/documents/Productos.csv")
        .pipe(csv({ separator: ";" }))
        .on("data", (data) => {
          const newProduct = newProducts.find((p) => p.sku === data.SKU);
          if (newProduct) {
            const variants = [
              {
                price: newProduct.price,
                inventory_levels: [
                  {
                    stock: newProduct.stock,
                  },
                ],
              },
            ];
            productsToUpdate.push({
              id: parseInt(data.ID),
              variants: variants,
            });
          } else {
            console.log(`SKU no encontrado en la tiendaNube: ${data.SKU}`);
          }
        })
        .on("end", () => {
          console.log(
            "IDs de productos a actualizar:",
            productsToUpdate.map((product) => product.id)
          );
          updateProductsRecursive(
            0,
            productsToUpdate,
            user_id,
            access_token,
            res
          );
        });
    })
    .on("error", (error) => {
      console.error("Error al leer el archivo CSV:", error);
      res.status(500).send("Error al leer el archivo CSV");
    });
};

function updateProductsRecursive(index, products, user_id, access_token, res) {
  if (index < products.length) {
    const product = products[index];
    const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/stock-price`;

    fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authentication: `bearer ${access_token}`,
      },
      body: JSON.stringify(product.variants),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Error en la solicitud: ${response.status} - ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Producto actualizado:", data);
        updateProductsRecursive(
          index + 1,
          products,
          user_id,
          access_token,
          res
        );
      })
      .catch((error) => {
        console.error("Error al actualizar el producto:", error);
        res.status(500).send("Error al actualizar el producto");
      });
  } else {
    console.log("Todos los productos actualizados.");
    res.send("Fin de actualización de productos");
  }
}

module.exports = { updateProducts };
