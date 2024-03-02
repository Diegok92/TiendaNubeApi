const express = require("express");
const router = express.Router();
const { getCategories } = require("../controllers/getCategories.js");

router.get("/", getCategories);

module.exports = router;
