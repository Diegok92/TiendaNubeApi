const express = require("express");
const router = express.Router();
const { getVariants } = require("../controllers/getVariants.js");

router.get("/", getVariants);

module.exports = router;
