const fs = require("fs");
const csv = require("csv-parser");

const postProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const products = [];
  let csvStartTime = null;
  let productsStartTime = null;

  // Tiempo de inicio para la lectura del archivo CSV
  csvStartTime = new Date();

  fs.createReadStream("app/assets/documents/productosParaSubir.csv")
    .pipe(csv({ separator: ";" }))
    .on("data", (data) => {
      if (
        data.SKU &&
        data.NAME &&
        data.PRICE &&
        data.PROMOTIONAL_PRICE &&
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
          promotional_price: parseFloat(data.PROMOTIONAL_PRICE),
          stock: parseInt(data.STOCK),
          description: data.DESCRIPTION,
          categories: categories,
        });
      }
    })
    .on("end", () => {
      // Tiempo de finalización para la lectura del archivo CSV
      const csvEndTime = new Date();
      const csvElapsedTime = csvEndTime - csvStartTime;

      console.log(
        `Tiempo de lectura del archivo productosParaSubir.csv: ${csvElapsedTime} ms`
      );

      // Tiempo de inicio para la carga de productos
      productsStartTime = new Date();

      postProductsRecursive(
        0,
        products,
        user_id,
        access_token,
        res,
        productsStartTime
      );
    });
};

function postProductsRecursive(
  index,
  products,
  user_id,
  access_token,
  res,
  productsStartTime
) {
  if (index < products.length) {
    const body = {
      name: { es: products[index].name },
      description: { es: products[index].description },
      categories: products[index].categories,
      variants: [
        {
          price: products[index].price,
          promotional_price: products[index].promotional_price,
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
        //console.log(data);
        postProductsRecursive(
          index + 1,
          products,
          user_id,
          access_token,
          res,
          productsStartTime
        );
      })
      .catch((error) => console.error(error));
  } else {
    // Tiempo de finalización para la carga de productos
    const productsEndTime = new Date();
    const productsElapsedTime = productsEndTime - productsStartTime;

    console.log(
      `Tiempo de carga de productos desde productosParaSubir.csv: ${productsElapsedTime} ms`
    );

    // Borra el contenido del archivo a partir de la segunda línea
    fs.readFile(
      "app/assets/documents/productosParaSubir.csv",
      "utf8",
      (err, data) => {
        if (err) {
          console.error("Error al leer el archivo:", err);
          return;
        }

        const lines = data.split("\n");
        const header = lines[0];
        fs.writeFile(
          "app/assets/documents/productosParaSubir.csv",
          header,
          (err) => {
            if (err) {
              console.error("Error al escribir en el archivo:", err);
              return;
            }
            console.log(
              "Contenido del archivo borrado después de la primera línea."
            );
          }
        );
      }
    );

    res.send("Fin carga de productos de productosParaSubir.csv");
  }
}

module.exports = { postProducts };
