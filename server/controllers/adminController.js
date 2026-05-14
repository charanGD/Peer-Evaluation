const { Team, User, Evaluation } = require("../module");
const { Op } = require("sequelize");

// Create a new user (student or staff) - Admin only
const createUser = async (req, res) => {
  try {
    const { userId, name, password, role } = req.body;

    if (!userId || !name || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["student", "staff"].includes(role)) {
      return res.status(400).json({ message: "Role must be student or staff" });
    }

    const existingUser = await User.findOne({ where: { userId } });
    if (existingUser) {
      return res.status(400).json({ message: "User with this ID already exists" });
    }

    const user = await User.create({ userId, name, password, role });

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} "${name}" created successfully`,
      user: {
        _id: user.id,
        userId: user.userId,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new team
const createTeam = async (req, res) => {
  try {
    const { teamName } = req.body;
    const createdBy = req.user.id || req.user._id;

    const existingTeam = await Team.findOne({ where: { teamName } });
    if (existingTeam) {
      return res.status(400).json({ message: "Team with this name already exists" });
    }

    const team = await Team.create({ teamName, createdBy });

    res.status(201).json({ message: "Team created successfully", team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teams with members
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        { model: User, as: "creator", attributes: ["name", "userId"] },
        { model: User, as: "staff", attributes: ["name", "userId"] }
      ]
    });

    const teamsWithMembers = await Promise.all(teams.map(async (team) => {
      const members = await User.findAll({
        where: { teamId: team.id, role: "student" },
        attributes: ["name", "userId"]
      });
      return {
        ...team.toJSON(),
        _id: team.id,
        memberCount: members.length,
        members
      };
    }));

    res.json(teamsWithMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add student to a team
const addUserToTeam = async (req, res) => {
  try {
    const { userId, teamId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const team = await Team.findByPk(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    user.teamId = teamId;
    await user.save();

    res.json({ message: `${user.name} added to team ${team.teamName}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign staff to a team
const assignStaffToTeam = async (req, res) => {
  try {
    const { staffId, teamId } = req.body;

    const staff = await User.findByPk(staffId);
    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ message: "Staff not found" });
    }

    const team = await Team.findByPk(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    team.staffId = staffId;
    await team.save();

    staff.teamId = teamId;
    await staff.save();

    res.json({ message: `${staff.name} assigned as mentor for team ${team.teamName}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all evaluations (admin)
const getAllEvaluations = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const queryOptions = {
      include: [
        { model: User, as: "evaluator", attributes: ["name", "userId", "role"] },
        { model: User, as: "evaluated", attributes: ["name", "userId"] },
        { model: Team, attributes: ["teamName"] }
      ],
      order: [["createdAt", "DESC"]]
    };

    if (search) {
      queryOptions.where = {
        comment: { [Op.like]: `%${search}%` }
      };
    }

    if (page && limit) {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const evaluations = await Evaluation.findAll(queryOptions);
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get analytics
const getAnalytics = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: "student" },
      attributes: { exclude: ["password"] },
      include: [{ model: Team }]
    });
    const allUsers = await User.findAll({ attributes: { exclude: ["password"] } });
    const evaluations = await Evaluation.findAll();

    const userScores = {};
    evaluations.forEach(e => {
      const uid = e.evaluatedUserId.toString();
      if (!userScores[uid]) {
        userScores[uid] = { peerTotal: 0, peerCount: 0, staffTotal: 0, staffCount: 0 };
      }
      const avg = (e.communication + e.teamwork + e.leadership + e.problemSolving) / 4;
      if (e.isStaffEvaluation) {
        userScores[uid].staffTotal += avg;
        userScores[uid].staffCount += 1;
      } else {
        userScores[uid].peerTotal += avg;
        userScores[uid].peerCount += 1;
      }
    });

    const leaderboard = students.map(user => {
      const uid = user.id.toString();
      const sd = userScores[uid];
      const peerAvg = sd && sd.peerCount > 0 ? parseFloat((sd.peerTotal / sd.peerCount).toFixed(2)) : 0;
      const staffAvg = sd && sd.staffCount > 0 ? parseFloat((sd.staffTotal / sd.staffCount).toFixed(2)) : 0;
      const overallAvg = peerAvg > 0 || staffAvg > 0
        ? parseFloat(((peerAvg + staffAvg) / (peerAvg > 0 && staffAvg > 0 ? 2 : 1)).toFixed(2)) : 0;
      return {
        _id: user.id,
        name: user.name,
        userId: user.userId,
        teamName: user.Team ? user.Team.teamName : "No Team",
        peerAvg, staffAvg, overallAvg,
        evaluationCount: (sd ? sd.peerCount + sd.staffCount : 0)
      };
    }).sort((a, b) => b.overallAvg - a.overallAvg);

    const teamPerformance = {};
    leaderboard.forEach(user => {
      if (!teamPerformance[user.teamName]) teamPerformance[user.teamName] = { total: 0, count: 0 };
      teamPerformance[user.teamName].total += user.overallAvg;
      teamPerformance[user.teamName].count += 1;
    });

    const teamStats = Object.keys(teamPerformance).map(teamName => ({
      teamName,
      averageScore: parseFloat((teamPerformance[teamName].total / teamPerformance[teamName].count).toFixed(2)),
      memberCount: teamPerformance[teamName].count
    })).sort((a, b) => b.averageScore - a.averageScore);

    const totalStudents = allUsers.filter(u => u.role === "student").length;
    const totalStaff = allUsers.filter(u => u.role === "staff").length;
    const totalTeams = await Team.count();
    const totalEvaluations = evaluations.length;

    res.json({
      summary: { totalStudents, totalStaff, totalTeams, totalEvaluations },
      leaderboard,
      teamPerformance: teamStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (admin)
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    
    let whereCondition = {};
    if (search) {
      whereCondition = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { userId: { [Op.like]: `%${search}%` } },
          { role: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const queryOptions = {
      where: whereCondition,
      attributes: { exclude: ["password"] },
      include: [{ model: Team }],
      order: [["createdAt", "DESC"]]
    };

    if (page && limit) {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const users = await User.findAll(queryOptions);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all staff (admin)
const getAllStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: { role: "staff" },
      attributes: { exclude: ["password"] },
      include: [{ model: Team }]
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createUser, createTeam, getAllTeams, addUserToTeam, assignStaffToTeam, getAllEvaluations, getAnalytics, getAllUsers, getAllStaff };