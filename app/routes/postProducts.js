const express = require("express");
const router = express.Router();
const { postProducts } = require("../controllers/postproducts.js");

router.get("/", postProducts);

module.exports = router;
