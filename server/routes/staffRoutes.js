const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authcontrol");
const { getMyStudents, submitStaffEvaluation, saveFinalMarks } = require("../controllers/staffController");

router.get("/my-students", protect, getMyStudents);
router.post("/evaluate", protect, submitStaffEvaluation);
router.post("/finalMarks", saveFinalMarks);

module.exports = router;