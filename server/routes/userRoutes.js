const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authcontrol");
const { getTeamMembers, getProfile } = require("../controllers/userControl");

router.get("/team-members", protect, getTeamMembers);
router.get("/profile", protect, getProfile);

module.exports = router;