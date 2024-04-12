const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const moment = require("moment-timezone");

const idCsvFilePath = "app/assets/documents/IDs.csv";
const variantsCsvFilePath = "app/assets/documents/variants.csv";

const csvWriter = createCsvWriter({
  path: variantsCsvFilePath,
  header: [
    { id: "product_id", title: "PRODUCT_ID" },
    { id: "sku", title: "SKU" },
    { id: "variant_id", title: "VARIANT_ID" },
    { id: "price", title: "PRICE" },
    { id: "promotional_price", title: "PROMOTIONAL_PRICE" },
    { id: "stock", title: "STOCK" },
    { id: "updated_at", title: "UPDATED_AT" },
  ],
  fieldDelimiter: ";",
});

const getVariants = async (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const startTime = Date.now();

  try {
    const idData = fs.readFileSync(idCsvFilePath, "utf8").split("\n");
    idData.shift(); // Omitir la primera línea
    const ids = idData.map((line) => line.trim()).filter((id) => id); // Filtrar IDs vacíos

    const requestsPerSecond = 2; // Número máximo de solicitudes por segundo
    const waitTimeBetweenRequests = 1000 / requestsPerSecond; // Tiempo de espera entre solicitudes en milisegundos

    for (const id of ids) {
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

      const variantRecords = variants.map((variant) => ({
        product_id: variant.product_id,
        sku: variant.sku,
        variant_id: variant.id,
        price: variant.price,
        promotional_price: variant.promotional_price,
        stock: variant.stock,
        updated_at: moment(variant.updated_at)
          .tz("America/Argentina/Buenos_Aires")
          .format("YYYY-MM-DDTHH:mm:ss"),
      }));

      await csvWriter.writeRecords(variantRecords, { append: true });

      console.log(`Variantes del producto ${id} guardadas exitosamente.`);

      // Espera entre solicitudes para cumplir con el límite de velocidad
      await new Promise((resolve) =>
        setTimeout(resolve, waitTimeBetweenRequests)
      );
    }
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / (1000 * 60); // Tiempo transcurrido en minutos
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
