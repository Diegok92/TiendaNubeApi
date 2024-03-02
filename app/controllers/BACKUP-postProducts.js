const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const postProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const prices = [];
  const SKUs = [];
  const stock = [];
  const name = [];
  const description = [];
  const categoriesList = [];

  //const costo = [];

  fs.createReadStream("app/assets/documents/nuevosProductos.csv")
    .pipe(csv({ separator: ";" }))
    .on("data", (data) => {
      //console.log(data);

      if (
        data.SKU &&
        data.NAME &&
        data.PRICE &&
        data.STOCK &&
        data.CATEGORIES &&
        data.DESCRIPTION
      ) {
        SKUs.push(data.SKU);
        prices.push(data.PRICE);
        stock.push(data.STOCK);
        name.push(data.NAME);
        description.push(data.DESCRIPTION);
        //categoriesList.push(data.CATEGORIES.split(",").map(Number)); //convierto las cat a num entero por la docu
        const categories = data.CATEGORIES.split(",").map(Number);
        if (categories.every(Number.isInteger)) {
          categoriesList.push(categories);
        } else {
          console.error("Las categorías no son números enteros:", categories);
        }
      }
    })
    .on("end", () => {
      postProductsRecursive(0);
    });

  function postProductsRecursive(index) {
    //segun https://tiendanube.github.io/api-documentation/resources/product

    if (index < SKUs.length) {
      const categories = categoriesList[index];
      const body = {
        name: { es: name[index] },
        description: { es: description[index] },
        categories: categories,
        variants: [
          {
            price: prices[index],
            stock: stock[index],
            sku: SKUs[index],
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
        .then((response) => response.json())
        .then((data) => {
          console.log(data); // Aquí puedes manejar la respuesta si es necesario
          setTimeout(() => postProductsRecursive(index + 1), 2000); // Llamada recursiva con el siguiente índice
        })
        .catch((error) => console.error(error));
    } else {
      res.send("Fin carga de productos"); // Envía la respuesta cuando se hayan procesado todos los productos
    }
  }
};

module.exports = { postProducts };
