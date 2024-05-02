const express = require("express");
const router = express.Router();
const { EXXIT_PostProducts } = require("../controllers/EXXIT_PostProducts.js");

router.get("/", EXXIT_PostProducts);

module.exports = router;
