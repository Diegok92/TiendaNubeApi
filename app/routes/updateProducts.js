const express = require("express");
const router = express.Router();
const { updateProducts } = require("../controllers/updateProducts.js");

router.get("/", updateProducts);

module.exports = router;
