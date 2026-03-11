const express = require("express");

const router = express.Router();

const { saveFinalMarks } = require("../controllers/staffController");

router.post("/finalMarks", saveFinalMarks);

module.exports = router;