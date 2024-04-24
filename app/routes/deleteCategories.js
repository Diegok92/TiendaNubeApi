const express = require("express");
const router = express.Router();
const { deleteCategories } = require("../controllers/deleteCategories.js");

router.get("/", deleteCategories);

module.exports = router;
