const Team = require("../module/Team");
const User = require("../module/user");
const Evaluation = require("../module/Evaluation");

// ==================== CREATE USER ====================
const createUser = async (req, res) => {
  try {

    const {
      userId,
      name,
      password,
      role
    } = req.body;

    if (
      !userId ||
      !name ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (
      !["student", "staff"].includes(role)
    ) {
      return res.status(400).json({
        message:
          "Role must be student or staff"
      });
    }

    const existingUser =
      await User.findOne({ userId });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User with this ID already exists"
      });
    }

    const user = await User.create({
      userId,
      name,
      password,
      role
    });

    res.status(201).json({
      message:
        `${role.charAt(0).toUpperCase() +
          role.slice(1)} "${name}" created successfully`,

      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== CREATE TEAM ====================
const createTeam = async (req, res) => {
  try {

    const { teamName } = req.body;

    const existingTeam =
      await Team.findOne({ teamName });

    if (existingTeam) {
      return res.status(400).json({
        message:
          "Team with this name already exists"
      });
    }

    const team = await Team.create({
      teamName,
      createdBy: req.user._id
    });

    res.status(201).json({
      message:
        "Team created successfully",
      team
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== GET ALL TEAMS ====================
const getAllTeams = async (req, res) => {
  try {

    const teams = await Team.find()

      .populate(
        "createdBy",
        "name userId"
      )

      .populate(
        "staffId",
        "name userId"
      )

      .lean();

    const teamsWithMembers =
      await Promise.all(

        teams.map(async (team) => {

          const members =
            await User.find({
              teamId: team._id,
              role: "student"
            })

            .select("name userId")

            .lean();

          return {
            ...team,
            memberCount: members.length,
            members
          };

        })
      );

    res.json(teamsWithMembers);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== ADD USER TO TEAM ====================
const addUserToTeam = async (req, res) => {
  try {

    const {
      userId,
      teamId
    } = req.body;

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const team =
      await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        message: "Team not found"
      });
    }

    user.teamId = teamId;

    await user.save();

    res.json({
      message:
        `${user.name} added to team ${team.teamName}`
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== ASSIGN STAFF ====================
const assignStaffToTeam = async (req, res) => {
  try {

    const {
      staffId,
      teamId
    } = req.body;

    const staff =
      await User.findById(staffId);

    if (
      !staff ||
      staff.role !== "staff"
    ) {
      return res.status(404).json({
        message: "Staff not found"
      });
    }

    const team =
      await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        message: "Team not found"
      });
    }

    team.staffId = staffId;

    await team.save();

    staff.teamId = teamId;

    await staff.save();

    res.json({
      message:
        `${staff.name} assigned as mentor for team ${team.teamName}`
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== GET ALL EVALUATIONS ====================
const getAllEvaluations = async (req, res) => {
  try {

    const page =
      parseInt(req.query.page) || 1;

    const limit =
      parseInt(req.query.limit) || 10;

    const skip =
      (page - 1) * limit;

    const evaluations =
      await Evaluation.find()

      .populate(
        "evaluatorId",
        "name userId role"
      )

      .populate(
        "evaluatedUserId",
        "name userId"
      )

      .populate(
        "teamId",
        "teamName"
      )

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit)

      .lean();

    res.json(evaluations);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== GET ANALYTICS ====================
const getAnalytics = async (req, res) => {
  try {

    const students =
      await User.find({
        role: "student"
      })

      .select("-password")

      .populate("teamId")

      .lean();

    const allUsers =
      await User.find()

      .select("-password")

      .lean();

    const evaluations =
      await Evaluation.find().lean();

    const userScores = {};

    evaluations.forEach((e) => {

      const uid =
        e.evaluatedUserId.toString();

      if (!userScores[uid]) {

        userScores[uid] = {
          peerTotal: 0,
          peerCount: 0,
          staffTotal: 0,
          staffCount: 0
        };

      }

      const avg =
        (
          e.communication +
          e.teamwork +
          e.leadership +
          e.problemSolving
        ) / 4;

      if (e.isStaffEvaluation) {

        userScores[uid].staffTotal += avg;

        userScores[uid].staffCount += 1;

      } else {

        userScores[uid].peerTotal += avg;

        userScores[uid].peerCount += 1;

      }

    });

    const leaderboard =
      students.map((user) => {

        const uid =
          user._id.toString();

        const sd =
          userScores[uid];

        const peerAvg =
          sd && sd.peerCount > 0
            ? parseFloat(
                (
                  sd.peerTotal /
                  sd.peerCount
                ).toFixed(2)
              )
            : 0;

        const staffAvg =
          sd && sd.staffCount > 0
            ? parseFloat(
                (
                  sd.staffTotal /
                  sd.staffCount
                ).toFixed(2)
              )
            : 0;

        const overallAvg =
          peerAvg > 0 || staffAvg > 0
            ? parseFloat(
                (
                  (
                    peerAvg +
                    staffAvg
                  ) /
                  (
                    peerAvg > 0 &&
                    staffAvg > 0
                      ? 2
                      : 1
                  )
                ).toFixed(2)
              )
            : 0;

        return {
          _id: user._id,
          name: user.name,
          userId: user.userId,
          teamName:
            user.teamId
              ? user.teamId.teamName
              : "No Team",
          peerAvg,
          staffAvg,
          overallAvg,
          evaluationCount:
            sd
              ? sd.peerCount +
                sd.staffCount
              : 0
        };

      })

      .sort(
        (a, b) =>
          b.overallAvg -
          a.overallAvg
      );

    const teamPerformance = {};

    leaderboard.forEach((user) => {

      if (
        !teamPerformance[user.teamName]
      ) {

        teamPerformance[user.teamName] = {
          total: 0,
          count: 0
        };

      }

      teamPerformance[user.teamName]
        .total += user.overallAvg;

      teamPerformance[user.teamName]
        .count += 1;

    });

    const teamStats =
      Object.keys(teamPerformance)

      .map((teamName) => ({
        teamName,

        averageScore:
          parseFloat(
            (
              teamPerformance[teamName]
                .total /
              teamPerformance[teamName]
                .count
            ).toFixed(2)
          ),

        memberCount:
          teamPerformance[teamName]
            .count
      }))

      .sort(
        (a, b) =>
          b.averageScore -
          a.averageScore
      );

    const totalStudents =
      allUsers.filter(
        (u) => u.role === "student"
      ).length;

    const totalStaff =
      allUsers.filter(
        (u) => u.role === "staff"
      ).length;

    const totalTeams =
      await Team.countDocuments();

    const totalEvaluations =
      evaluations.length;

    res.json({
      summary: {
        totalStudents,
        totalStaff,
        totalTeams,
        totalEvaluations
      },

      leaderboard,

      teamPerformance:
        teamStats
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== GET ALL USERS ====================
const getAllUsers = async (req, res) => {
  try {

    const page =
      parseInt(req.query.page) || 1;

    const limit =
      parseInt(req.query.limit) || 10;

    const skip =
      (page - 1) * limit;

    const search =
      req.query.search || "";

    const users =
      await User.find({
        name: {
          $regex: search,
          $options: "i"
        }
      })

      .select("-password")

      .populate(
        "teamId",
        "teamName"
      )

      .skip(skip)

      .limit(limit)

      .lean();

    res.json(users);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== GET ALL STAFF ====================
const getAllStaff = async (req, res) => {
  try {

    const staff =
      await User.find({
        role: "staff"
      })

      .select("-password")

      .populate(
        "teamId",
        "teamName"
      )

      .lean();

    res.json(staff);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

module.exports = {
  createUser,
  createTeam,
  getAllTeams,
  addUserToTeam,
  assignStaffToTeam,
  getAllEvaluations,
  getAnalytics,
  getAllUsers,
  getAllStaff
};