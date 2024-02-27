const express = require("express");
const router = express.Router();
const { postImages2 } = require("../controllers/postImages.js");

router.get("/", postImages2);

module.exports = router;
