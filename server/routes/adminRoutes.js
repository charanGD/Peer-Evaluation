const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authcontrol");
const { createUser, createTeam, getAllTeams, addUserToTeam, assignStaffToTeam, getAllEvaluations, getAnalytics, getAllUsers, getAllStaff } = require("../controllers/adminController");

router.post("/create-user", protect, adminOnly, createUser);
router.post("/teams", protect, adminOnly, createTeam);
router.get("/teams", protect, adminOnly, getAllTeams);
router.post("/add-to-team", protect, adminOnly, addUserToTeam);
router.post("/assign-staff", protect, adminOnly, assignStaffToTeam);
router.get("/evaluations", protect, adminOnly, getAllEvaluations);
router.get("/analytics", protect, adminOnly, getAnalytics);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/staff", protect, adminOnly, getAllStaff);

module.exports = router;
