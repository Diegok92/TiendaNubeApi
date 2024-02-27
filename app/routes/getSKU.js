const express = require("express");
const router = express.Router();
const { getSKU } = require("../controllers/getSKU.js");

router.get("/", getSKU);

module.exports = router;
