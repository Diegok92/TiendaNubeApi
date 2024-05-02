const express = require("express");
const router = express.Router();
const { MVU_UpdateProducts } = require("../controllers/MVU_UpdateProducts.js");

router.get("/", MVU_UpdateProducts);

module.exports = router;
