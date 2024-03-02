const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const postCategories = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const products = [];
  var i = 0;
  //const costo = [];

  fs.createReadStream("app/assets/documents/categorias.csv")
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
        //categoriesList.push(data.CATEGORIES.split(",").map(Number)); //convierto las cat a num entero por la docu
        const categories = data.CATEGORIES.split(",").map((category) =>
          category.trim()
        );
        //console.log(categories);
        products.push({
          name: { es: data.NAME },
          description: { es: data.DESCRIPTION },
          categories: [{ name: { es: categories[i] } }],
          variants: [
            {
              price: data.PRICE,
              stock: data.STOCK,
              sku: data.SKU,
            },
          ],
        });
        i++;
      }
    })
    .on("end", () => {
      postCategoriesRecursive(0);
    });

  function postCategoriesRecursive(index) {
    //segun https://tiendanube.github.io/api-documentation/resources/product

    if (index < products.length) {
      const body = products[index];

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
          setTimeout(() => postCategoriesRecursive(index + 1), 2000); // Llamada recursiva con el siguiente índice
        })
        .catch((error) => console.error(error));
    } else {
      res.send("Fin carga de productos"); // Envía la respuesta cuando se hayan procesado todos los productos
    }
  }
};

module.exports = { postCategories };
