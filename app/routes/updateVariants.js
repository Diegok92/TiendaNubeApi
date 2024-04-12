const express = require("express");
const router = express.Router();
const { updateVariants } = require("../controllers/updateVariants.js");

router.get("/", updateVariants);

module.exports = router;
