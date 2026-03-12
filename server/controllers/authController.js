const User = require("../module/user");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Login user (student/staff/admin) with register number + password
const login = async (req, res) => {
  try {
    const { userId, password, role } = req.body;

    const query = { userId };
    if (role) query.role = role;

    const user = await User.findOne(query).populate("teamId");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        teamId: user.teamId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login };
