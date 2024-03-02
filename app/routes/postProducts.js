const express = require("express");
const router = express.Router();
const { postProducts } = require("../controllers/postProducts.js");

router.get("/", postProducts);

module.exports = router;
