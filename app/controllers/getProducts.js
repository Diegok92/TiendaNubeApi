const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const csvFilePath = "app/assets/documents/Productos.csv";

const csvWriter = createCsvWriter({
  path: csvFilePath,
  header: [
    { id: "id", title: "ID" },
    { id: "sku", title: "SKU" },
    { id: "variant_id", title: "VARIANT_ID" },
    { id: "categories", title: "CATEGORIES" },
    { id: "name", title: "NAME" },
    { id: "price", title: "PRICE" },
    { id: "stock", title: "STOCK" },
    { id: "published", title: "PUBLISHED" },
    { id: "canonical_url", title: "CANONICAL_URL" },
    { id: "description", title: "DESCRIPTION" },
    { id: "updated_at", title: "UPDATED_AT" },
  ],
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
            variant_id: row.variants[0].id,
            name: row.name.es,
            price: row.variants[0].price,
            stock: row.variants[0].stock,
            categories: row.categories[0].id,
            published: row.published,
            canonical_url: row.canonical_url,
            description: row.description.es,
            updated_at: row.updated_at,
          }));

        // Append records to existing file, creating the file if it doesn't exist
        csvWriter
          .writeRecords(filteredProducts, { append: true })
          .then(() => {
            res.send("Productos guardados exitosamente en Productos.csv");
          })
          .catch((err) => {
            console.error(err);
            res
              .status(500)
              .send("Error al guardar los productos en Productos.csv");
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
