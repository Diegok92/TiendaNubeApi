const login = (req, res) => {
  res.redirect(
    "https://www.tiendanube.com/apps/10401/authorize?state=csrf-code"
  );
};

module.exports = { login };
