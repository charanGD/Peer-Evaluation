const { User, Team } = require("../module");

// Get team members for the logged-in user
const getTeamMembers = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id || req.user._id);

    if (!user.teamId) {
      return res.status(400).json({ message: "You are not assigned to any team" });
    }

    const teamMembers = await User.findAll({
      where: {
        teamId: user.teamId,
        role: "student"
      },
      attributes: { exclude: ["password"] },
      include: [{ model: Team }]
    });

    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id || req.user._id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Team }]
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTeamMembers, getProfile };