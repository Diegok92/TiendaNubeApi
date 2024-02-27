const express = require("express");
const router = express.Router();
const { oAuth } = require("../controllers/oAuth.js");

router.get("/", oAuth);

module.exports = router;
