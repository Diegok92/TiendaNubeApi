const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const getCategories = (req, res) => {
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const startTime = new Date();

  const endpoint = `https://api.tiendanube.com/v1/${user_id}/categories`;

  // Función para obtener todas las categorías con paginación y respetar el límite de velocidad
  const getAllCategories = async () => {
    let allCategories = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const response = await fetch(`${endpoint}?page=${page}&per_page=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authentication: `bearer ${access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          `Error al obtener las categorías: ${response.status} - ${response.statusText}`
        );
      }

      if (response.headers.get("X-Rate-Limit-Remaining") === "0") {
        const resetTime = parseInt(response.headers.get("X-Rate-Limit-Reset"));
        const currentTime = new Date().getTime();
        const waitTime = resetTime - currentTime + 1000; // Añadir 1 segundo extra para asegurar
        console.log(
          `Esperando ${waitTime} ms antes de la siguiente solicitud.`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      if (response.headers.get("X-Total-Count")) {
        const totalCount = parseInt(response.headers.get("X-Total-Count"));
        totalPages = Math.ceil(totalCount / 100);
      }

      allCategories = allCategories.concat(data);
      page++;
    }

    return allCategories;
  };

  getAllCategories()
    .then((categories) => {
      const formattedCategories = categories.map((category) => ({
        category_id: category.id,
        name: category.name.es,
        parent_id: category.parent,
        subcategories: category.subcategories.join(","),
      }));

      const csvWriter = createCsvWriter({
        path: "app/assets/documents/categorias.csv",
        header: [
          { id: "category_id", title: "CATEGORY_ID" },
          { id: "name", title: "NAME" },
          { id: "parent_id", title: "PARENT_ID" },
          { id: "subcategories", title: "SUBCATEGORIES" },
        ],
        fieldDelimiter: ";",
      });

      return csvWriter.writeRecords(formattedCategories);
    })
    .then(() => {
      const endTime = new Date();
      const elapsedTime = endTime - startTime;
      console.log(`Tiempo de guardado en CSV: ${elapsedTime} ms`);
      console.log("Categorías guardadas en categorias.csv");
      res.status(200).send("Categorías guardadas en categorias.csv");
    })
    .catch((error) => {
      console.error(
        "Error al obtener y guardar las categorías:",
        error.message
      );
      res.status(500).send("Error al obtener y guardar las categorías");
    });
};

module.exports = { getCategories };
