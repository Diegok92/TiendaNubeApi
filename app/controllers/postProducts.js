const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const postProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const products = [];
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
        const categories = data.CATEGORIES.split(",");
        const categoryName = categories[0].trim();
        const subCategories = categories
          .slice(1)
          .map((subCategory) => subCategory.trim());

        createCategoryRecursive(categoryName, null)
          .then((categoryId) => {
            const categoryObjects = [{ id: categoryId }];

            // Luego, creamos las subcategorías y las agregamos al array de categorías del producto
            Promise.all(
              subCategories.map((subcategory) =>
                createCategory(subcategory, categoryId)
              )
            )
              .then((subcategoryIds) => {
                categoryObjects.push(...subcategoryIds.map((id) => ({ id })));
                //console.log(categories);

                products.push({
                  name: { es: data.NAME },
                  description: { es: data.DESCRIPTION },
                  categories: categoryObjects,
                  variants: [
                    {
                      price: data.PRICE,
                      stock: data.STOCK,
                      sku: data.SKU,
                    },
                  ],
                });
                if (products.length === 1) {
                  postProductsRecursive(0);
                }
              })
              .catch((error) => console.error(error));
          })
          .catch((error) => console.error(error));
      }
    })
    .on("end", () => {
      if (products.length === 0) {
        res.send("No hay productos para cargar");
      }
    });

  function createCategoryRecursive(name, parentId) {
    const endpoint = `https://api.tiendanube.com/v1/${user_id}/categories`;

    const body = {
      name: { es: name },
      parent_id: parentId,
    };

    return new Promise((resolve, reject) => {
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          resolve(data.id);
        })
        .catch((error) => reject(error));
    });
  }

  function postProductsRecursive(index) {
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
          setTimeout(() => postProductsRecursive(index + 1), 2000); // Llamada recursiva con el siguiente índice
        })
        .catch((error) => console.error(error));
    } else {
      res.send("Fin carga de productos"); // Envía la respuesta cuando se hayan procesado todos los productos
    }
  }

  function createCategory(name, parentId) {
    const endpoint = `https://api.tiendanube.com/v1/${user_id}/categories`;

    const body = {
      name: { es: name },
      parent_id: parentId,
    };

    return fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => data.id)
      .catch((error) => console.error(error));
  }
};

module.exports = { postProducts };
