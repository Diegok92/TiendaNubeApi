const express = require("express");
const router = express.Router();
const { putImages2 } = require("../controllers/putImages.js");

router.get("/", putImages2);

module.exports = router;
