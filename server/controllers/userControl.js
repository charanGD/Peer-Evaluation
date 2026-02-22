const User = require("../models/user");
const bcrypt = require("bcryptjs");

const createUserByAdmin = async (req, res) => {
  try {
    const { userId, name, role, password } = req.body;

    if (role === "admin") {
      return res.status(403).json({ message: "Cannot create another admin" });
    }

    const userExists = await User.findOne({ userId });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId,
      name,
      role,
      password: hashedPassword
    });

    res.status(201).json({ message: "User created successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createUserByAdmin };