const User = require("../module/user");

// Get team members for the logged-in user
const getTeamMembers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.teamId) {
      return res.status(400).json({ message: "You are not assigned to any team" });
    }

    const teamMembers = await User.find({
      teamId: user.teamId,
      role: "student"
    }).select("-password").populate("teamId");

    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("teamId");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTeamMembers, getProfile };