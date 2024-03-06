const fs = require("fs");
const csv = require("csv-parser");

const postProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const products = [];

  fs.createReadStream("app/assets/documents/nuevosProductos.csv")
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
        const categories = data.CATEGORIES.split(",").map((category) =>
          parseInt(category.trim())
        );

        products.push({
          sku: data.SKU,
          name: data.NAME,
          price: parseFloat(data.PRICE),
          stock: parseInt(data.STOCK),
          description: data.DESCRIPTION,
          categories: categories,
        });
      }
    })
    .on("end", () => {
      postProductsRecursive(0, products, user_id, access_token, res);
    });
};

function postProductsRecursive(index, products, user_id, access_token, res) {
  if (index < products.length) {
    const body = {
      name: { es: products[index].name },
      description: { es: products[index].description },
      categories: products[index].categories,
      variants: [
        {
          price: products[index].price,
          stock: products[index].stock,
          sku: products[index].sku,
        },
      ],
    };

    const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/`;

    fetch(endpoint, {
      method: "POST",
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
      .then((data) => {
        console.log(data);
        setTimeout(
          () =>
            postProductsRecursive(
              index + 1,
              products,
              user_id,
              access_token,
              res
            ),
          2000
        );
      })
      .catch((error) => console.error(error));
  } else {
    res.send("Fin carga de productos");
  }
}

module.exports = { postProducts };
