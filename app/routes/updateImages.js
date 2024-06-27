const express = require("express");
const router = express.Router();
const { updateImages } = require("../controllers/updateImages.js");

router.get("/", updateImages);

module.exports = router;
