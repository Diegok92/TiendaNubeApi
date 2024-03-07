const express = require("express");
const router = express.Router();
const { deleteProducts } = require("../controllers/deleteProducts.js");

router.get("/", deleteProducts);

module.exports = router;
