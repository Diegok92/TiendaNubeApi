const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const moment = require("moment-timezone");

const productosCsvFilePath = "app/assets/documents/Productos.csv";
const variantsCsvFilePath = "app/assets/documents/variants.csv";

const csvWriter = createCsvWriter({
  path: variantsCsvFilePath,
  header: [
    { id: "product_id", title: "PRODUCT_ID" },
    { id: "sku", title: "SKU" },
    { id: "variant_id", title: "VARIANT_ID" },
    { id: "categories", title: "CATEGORIES" },
    { id: "name", title: "NAME" },
    { id: "price", title: "PRICE" },
    { id: "promotional_price", title: "PROMOTIONAL_PRICE" },
    { id: "stock", title: "STOCK" },
    { id: "values", title: "VALUES" },
    { id: "updated_at", title: "UPDATED_AT" },
  ],
  fieldDelimiter: ";",
});

const getVariants = async (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const startTime = Date.now();

  try {
    fs.truncateSync(variantsCsvFilePath);
    const productosData = fs
      .readFileSync(productosCsvFilePath, "utf8")
      .split("\n");
    productosData.shift(); // Omitir la primera línea
    const productos = productosData.map((line) => line.trim().split(";"));

    const requestsPerSecond = 2;
    const waitTimeBetweenRequests = 1000 / requestsPerSecond;

    for (const producto of productos) {
      const id = producto[0];
      const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${id}/variants`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authentication: `bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        console.error(
          `Error al obtener las variantes del producto ${id}: ${response.status} - ${response.statusText}`
        );
        continue;
      }

      const variants = await response.json();

      for (const variant of variants) {
        const sku = variant.sku;
        const variantRecords = {
          product_id: id,
          sku: sku,
          variant_id: variant.id,
          categories: producto[3], // Asumiendo que las categorías están en la cuarta columna de Productos.csv
          name: producto[4], // Asumiendo que el nombre está en la quinta columna de Productos.csv
          price: variant.price,
          promotional_price: variant.promotional_price,
          stock: variant.stock,
          values: variant.values.map((value) => value.es).join(", "),
          updated_at: moment(variant.updated_at)
            .tz("America/Argentina/Buenos_Aires")
            .format("YYYY-MM-DDTHH:mm:ss"),
        };

        await csvWriter.writeRecords([variantRecords], { append: true });

        console.log(
          `Variante ${variant.id} del producto ${id} guardada exitosamente.`
        );
      }

      await new Promise((resolve) =>
        setTimeout(resolve, waitTimeBetweenRequests)
      );
    }
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / (1000 * 60);
    console.log(
      `Proceso completado. Tiempo transcurrido: ${elapsedTime.toFixed(
        2
      )} minutos.`
    );

    res.send("Variantes guardadas exitosamente en variants.csv");
  } catch (error) {
    console.error("Error al obtener las variantes:", error);
    res.status(500).send("Error al obtener las variantes");
  }
};

module.exports = { getVariants };
