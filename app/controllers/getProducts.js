const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const csvFilePath = "app/assets/documents/Productos.csv";
const idCsvFilePath = "app/assets/documents/IDs.csv"; // Nueva ruta para el archivo ID.csv

const csvWriter = createCsvWriter({
  path: csvFilePath,
  header: [
    { id: "id", title: "ID" },
    { id: "sku", title: "SKU" },
    { id: "variant_id", title: "VARIANT_ID" },
    { id: "categories", title: "CATEGORIES" },
    { id: "name", title: "NAME" },
    { id: "price", title: "PRICE" },
    { id: "promotional_price", title: "PROMOTIONAL_PRICE" },
    { id: "stock", title: "STOCK" },
    { id: "published", title: "PUBLISHED" },
    { id: "canonical_url", title: "CANONICAL_URL" },
    { id: "updated_at", title: "UPDATED_AT" },
  ],
  fieldDelimiter: ";",
});

const csvWriterID = createCsvWriter({
  // datos para IDs.csv
  path: idCsvFilePath,
  header: [{ id: "id", title: "ID" }],
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

      const totalProducts = Number(response.headers.get("X-Total-Count"));
      const totalPages = Math.ceil(totalProducts / 100);

      if (page < totalPages) {
        await fetchProducts(page + 1);
      } else {
        const filteredProducts = allProducts
          .filter(
            (row) =>
              row &&
              row.published &&
              row.variants &&
              row.variants.length >= 0 &&
              row.categories &&
              row.categories.length >= 0
          )
          .map((row) => ({
            id: row.id || "",
            sku: row.variants[0].sku || "",
            variant_id: row.variants[0].id || "",
            name: (row.name && row.name.es) || "",
            price: row.variants[0].price || "",
            promotional_price: row.variants[0].promotional_price || "",
            stock: row.variants[0].stock || "",
            categories: (row.categories[0] && row.categories[0].id) || "",
            published: row.published || "",
            canonical_url: row.canonical_url || "",
            updated_at: row.updated_at || "",
          }));

        let firstLine = "";
        try {
          const fileData = fs.readFileSync(csvFilePath, "utf8");
          const lines = fileData.split("\n");
          if (lines.length > 0) {
            firstLine = lines[0].trim();
          }
        } catch (readError) {
          console.error("Error al leer el archivo:", readError);
        }

        fs.truncate(csvFilePath, 0, async (truncateError) => {
          if (truncateError) {
            console.error("Error al truncar el archivo:", truncateError);
            return res
              .status(500)
              .send("Error al truncar el archivo Productos.csv");
          }

          if (firstLine) {
            try {
              await fs.promises.appendFile(csvFilePath, firstLine + "\n");
            } catch (appendError) {
              console.error("Error al escribir la primera línea:", appendError);
              return res
                .status(500)
                .send("Error al escribir la primera línea en Productos.csv");
            }
          }

          try {
            await csvWriter.writeRecords(filteredProducts, { append: true });

            // Ahora guardamos los IDs en el archivo ID.csv
            const idRecords = filteredProducts.map((product) => ({
              id: product.id,
              variant_id: product.variant_id,
              sku: product.sku,
              price: product.price,
              promotional_price: product.promotional_price,
              stock: product.stock,
              updated_at: product.updated_at,
            }));

            if (idRecords.length > 0) {
              // Verificar si hay registros antes de escribir
              await csvWriterID.writeRecords(idRecords);
            }

            res.send("Productos guardados exitosamente en Productos.csv");
          } catch (writeError) {
            console.error("Error al guardar los productos:", writeError);
            res
              .status(500)
              .send("Error al guardar los productos en Productos.csv");
          }
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
