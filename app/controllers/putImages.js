const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const { log } = require("console");

const putImages2 = (req, res) => {
  // Define los parámetros necesarios para la solicitud
  const access_token = req.query.access_token;
  const user_id = req.query.user_id;
  const id_productos = [];
  const SKUs = [];

  fs.createReadStream("app/assets/documents/SKUs.csv") // Cambia 'input.csv' al nombre de tu archivo CSV
    .pipe(csv({ separator: ";" })) // Asegúrate de usar el mismo delimitador que se usó al crear el CSV
    .on("data", (data) => {
      console.log(data);

      if (data.SKU != "no tiene") {
        id_productos.push(data.ID);
        SKUs.push(data.SKU);
      }
    })
    .on("end", () => {
      putImages2(id_productos[0], SKUs[0], 0);
    });

  console.log("SKUS: " + SKUs);

  function putImages2(id_producto, SKU, index) {
    imgBase64 = buscarYConvertirImagen(SKU);
    const body = {};
    body.filename = SKU;
    body.attachment = imgBase64;

    const endpoint = `https://api.tiendanube.com/v1/${user_id}/products/${id_producto}/images`;

    if (index < id_productos.length) {
      index++;
      // if (index % 10 == 0) {
      //   TIME_RANGE = 1500;
      // } else {
      //   TIME_RANGE = 100;
      // }
      TIME_RANGE = 2000;
      if (imgBase64 != false) {
        setTimeout(
          () => putImages2(id_productos[index], SKUs[index], index),
          TIME_RANGE
        );
        initFetch(endpoint, body);
      } else {
        setTimeout(
          () => putImages2(id_productos[index], SKUs[index], index),
          TIME_RANGE
        );
      }
    }
  }

  function initFetch(endpoint, body) {
    fetch(endpoint, {
      method: "PUT",
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
  res.send("Fin actualizacion imagenes");
};

// Función para buscar y leer la imagen
function buscarYConvertirImagen(nombreImagenBuscada) {
  const rutaCarpetaDL = path.join(__dirname, "..", "assets/images"); // Subir un nivel desde la ubicación actual y buscar la carpeta "DL"

  try {
    const archivos = fs.readdirSync(rutaCarpetaDL);

    const imagenEncontrada = archivos.find((archivo) =>
      archivo.startsWith(`${nombreImagenBuscada}.`)
    );

    //console.log("nombre Imagen buscada:" + nombreImagenBuscada);

    if (!imagenEncontrada) {
      return false;
    }

    const rutaImagen = path.join(rutaCarpetaDL, imagenEncontrada);
    const data = fs.readFileSync(rutaImagen, { encoding: "base64" });

    return data;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

module.exports = { putImages2 };
