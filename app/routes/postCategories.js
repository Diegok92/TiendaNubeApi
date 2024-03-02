const express = require("express");
const router = express.Router();
const { postCategories } = require("../controllers/postCategories.js");

router.get("/", postCategories);

module.exports = router;
