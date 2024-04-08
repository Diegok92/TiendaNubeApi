const express = require("express");
const router = express.Router();
const { updatePostProducts } = require("../controllers/updatePostProducts.js");

router.get("/", updatePostProducts);

module.exports = router;
