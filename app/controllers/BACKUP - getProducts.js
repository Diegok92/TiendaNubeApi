const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const fileExists = fs.existsSync("Productos.csv");
const csvWriter = createCsvWriter({
  path: "app/assets/documents/Productos.csv",
  header: [
    { id: "id", title: "ID" },
    { id: "name", title: "NAME" },
    { id: "canonical_url", title: "CANONICAL_URL" },
    { id: "published", title: "PUBLISHED" },
    { id: "price", title: "PRICE" },
  ],
  append: fileExists,
  fieldDelimiter: ";",
});

const getProducts = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;

  let allProducts = [];

  const fetchProducts = async (page = 1) => {
    const endpoint = `https://api.tiendanube.com/v1/${user_id}/products?page=${page}&per_page=100`;

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authentication: `bearer ${access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        allProducts.push(...data);

        if (data.length === 100) {
          await fetchProducts(page + 1);
        } else {
          const json_data = [];
          allProducts.forEach((row) => {
            if (row.published == true) {
              json_data.push({
                id: row.id,
                name: row.name.es,
                canonical_url: row.canonical_url,
                published: row.published,
                price: row.variants[0].price,
              });
            }
          });

          // Medir el tiempo de escritura en el archivo CSV
          console.time("Tiempo de escritura en el archivo CSV");

          csvWriter
            .writeRecords(json_data)
            .then(() => {
              console.timeEnd("Tiempo de escritura en el archivo CSV");
              res.send("Productos guardados exitosamente");
            })
            .catch((err) => {
              console.error(err);
              res.status(500).send("Error al guardar los productos");
            });
        }
      } else {
        console.error(
          `Error al obtener los productos: ${response.status} - ${response.statusText}`
        );
        res
          .status(response.status)
          .send(
            `Error al obtener los productos: ${response.status} - ${response.statusText}`
          );
      }
    } catch (error) {
      console.error("Error al obtener los productos:", error);
      res.status(500).send("Error al obtener los productos");
    }
  };

  fetchProducts();
};

module.exports = { getProducts };
