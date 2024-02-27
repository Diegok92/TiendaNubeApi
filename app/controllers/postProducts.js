const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const postProducts = (req, res) => {
  // Define los parámetros necesarios para la solicitud
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const prices = [];
  const SKUs = [];
  const stock = [];
  const name = [];
  const descripcion = [];

  //const costo = [];

  fs.createReadStream("app/assets/documents/nuevosProductos.csv") // Cambia 'input.csv' al nombre de tu archivo CSV
    .pipe(csv({ separator: ";" })) // Asegúrate de usar el mismo delimitador que se usó al crear el CSV
    .on("data", (data) => {
      console.log(data);
    })
    .on("end", () => {
      postProducts(prices[0], SKUs[0], stock[0], name[0], descripcion[0], 0);
    });

  console.log("SKUS: " + SKUs);

  function postProducts(SKU, price, stock, name, descripcion, index) {
    const body = {};
    body.name = name;
    body.SKU = SKU;
    body.descripcion = descripcion;
    //creo segun https://tiendanube.github.io/api-documentation/resources/product
    body.variants[0] = price;
    body.variants[2] = stock;

    const endpoint = `https://api.tiendanube.com/v1/${user_id}/products`;
  }

  initFetch(endpoint, body);

  function initFetch(endpoint, body) {
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authentication: `bearer ${access_token}`,
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      // .then((data) => console.log(data))
      .catch((error) => console.error(error));
  }
  res.send("Fin carga de productos");
};

module.exports = { postProducts };
