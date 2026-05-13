require("dotenv").config();
const { sequelize } = require("./config/db");
const { User } = require("./module");

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // ensure tables exist

    const existing = await User.findOne({ where: { userId: "ADMIN001" } });
    if (existing) {
      console.log("Admin already exists");
    } else {
      await User.create({ userId: "ADMIN001", name: "Admin", password: "admin123", role: "admin" });
      console.log("Admin created: ADMIN001 / admin123");
    }

    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

seed();
