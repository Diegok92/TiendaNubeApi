const fs = require("fs");

const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const fileExists = fs.existsSync("Productos.csv");
const csvWriter = createCsvWriter({
  path: "app/assets/documents/Productos.csv",
  header: [
    { id: "id", title: "ID" },
    { id: "sku", title: "SKU" },
    { id: "variantId", title: "VARIANTID" },
    { id: "name", title: "NAME" },
    { id: "canonical_url", title: "CANONICAL_URL" },
    { id: "published", title: "PUBLISHED" },
    { id: "price", title: "PRICE" },
  ],
  append: fileExists,
  fieldDelimiter: ";",
});

const getProducts = async (req, res) => {
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

      if (!response.ok) {
        throw new Error(
          `Error al obtener los productos: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      allProducts.push(...data);

      // Check if there are more products to fetch
      const totalProducts = Number(response.headers.get("X-Total-Count"));
      const totalPages = Math.ceil(totalProducts / 100);

      if (page < totalPages) {
        // Fetch next page
        await fetchProducts(page + 1);
      } else {
        // All products fetched, process data
        const filteredProducts = allProducts
          .filter((row) => row.published)
          .map((row) => ({
            id: row.id,
            sku: row.variants[0].sku,
            variantId: row.variants[0].id,
            name: row.name.es,
            canonical_url: row.canonical_url,
            published: row.published,
            price: row.variants[0].price,
          }));

        // Medir el tiempo de escritura en el archivo CSV
        console.time("Tiempo de escritura en el archivo CSV");

        csvWriter
          .writeRecords(filteredProducts)
          .then(() => {
            console.timeEnd("Tiempo de escritura en el archivo CSV");
            res.send("Productos guardados exitosamente");
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send("Error al guardar los productos");
          });
      }
    } catch (error) {
      console.error("Error al obtener los productos:", error);
      res.status(500).send("Error al obtener los productos");
    }
  };

  fetchProducts();
};

module.exports = { getProducts };
