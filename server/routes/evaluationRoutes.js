const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authcontrol");
const { submitEvaluation, getMyEvaluations, getSubmittedEvaluations } = require("../controllers/evaluationController");

router.post("/submit", protect, submitEvaluation);
router.get("/my-evaluations", protect, getMyEvaluations);
router.get("/submitted", protect, getSubmittedEvaluations);

module.exports = router;
