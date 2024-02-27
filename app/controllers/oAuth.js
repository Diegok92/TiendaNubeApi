const oAuth = (req, res) => {
  const CODE = req.query.code;
  console.log("CODE: ", CODE);

  const URL = "https://www.tiendanube.com/apps/authorize/token";

  const data = {
    client_id: process.env.APP_ID,
    client_secret: process.env.SECRET_ID,
    grant_type: "authorization_code",
    code: CODE,
  };

  fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      const access_token = data.access_token;
      const user_id = data.user_id;

      //console.log(data);

      res.redirect(
        `http://localhost:${process.env.PORT}/getProducts?access_token=${access_token}&user_id=${user_id}`
      );
      console.log({ access_token, user_id });
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = { oAuth };
