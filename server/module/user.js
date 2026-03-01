const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,   
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["student", "staff", "admin"],
    required: true
  },

  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);