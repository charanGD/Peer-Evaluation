const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const path = require("path");
const { connectDB, sequelize } = require("./config/db");
const { User } = require("./module");

connectDB().then(async () => {
  await sequelize.sync();
  
  // Auto-seed admin user
  const existing = await User.findOne({ where: { userId: "ADMIN001" } });
  if (!existing) {
    await User.create({ userId: "ADMIN001", name: "Admin", password: "admin123", role: "admin" });
    console.log("Auto-seeded Admin: ADMIN001 / admin123");
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "..", "client")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/evaluations", require("./routes/evaluationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/staff", require("./routes/staffRoutes"));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

// Redirect old dashboard.html paths to new filenames
app.get("/mentor-dashboard/dashboard.html", (req, res) => {
  res.redirect("/mentor-dashboard/staff.html");
});
app.get("/student-dashboard/dashboard.html", (req, res) => {
  res.redirect("/student-dashboard/student.html");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});