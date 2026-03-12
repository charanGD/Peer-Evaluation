const mongoose = require("mongoose");
const User = require("./module/user");
require("dotenv").config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // Drop old email index if exists
  try {
    await mongoose.connection.db.collection("users").dropIndex("email_1");
    console.log("Dropped email_1 index");
  } catch (e) {
    console.log("No email_1 index to drop");
  }

  // Create admin if not exists
  const existing = await User.findOne({ userId: "ADMIN001" });
  if (existing) {
    console.log("Admin already exists");
  } else {
    await User.create({ userId: "ADMIN001", name: "Admin", password: "admin123", role: "admin" });
    console.log("Admin created: ADMIN001 / admin123");
  }

  process.exit(0);
}

seed().catch(function(e) { console.error(e.message); process.exit(1); });
