const express = require("express");
const router = express.Router();
const { deleteImages2 } = require("../controllers/deleteImages.js");

router.get("/", deleteImages2);

module.exports = router;
