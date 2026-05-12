const User = require("../module/user");

// ==================== GET TEAM MEMBERS ====================
const getTeamMembers = async (req, res) => {
  try {

    // ==================== SEARCH ====================
    const search =
      req.query.search || "";

    // ==================== CURRENT USER ====================
    const user =
      await User.findById(
        req.user._id
      ).lean();

    if (!user.teamId) {
      return res.status(400).json({
        message:
          "You are not assigned to any team"
      });
    }

    // ==================== TEAM MEMBERS ====================
    const teamMembers =
      await User.find({
        teamId: user.teamId,

        role: "student",

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

      .lean();

    res.json(teamMembers);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== GET PROFILE ====================
const getProfile = async (req, res) => {
  try {

    const user =
      await User.findById(
        req.user._id
      )

      .select("-password")

      .populate(
        "teamId",
        "teamName"
      )

      .lean();

    res.json(user);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

module.exports = {
  getTeamMembers,
  getProfile
};