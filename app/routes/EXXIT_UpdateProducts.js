const express = require("express");
const router = express.Router();
const {
  EXXIT_UpdateProducts,
} = require("../controllers/EXXIT_UpdateProducts.js");

router.get("/", EXXIT_UpdateProducts);

module.exports = router;
