const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema({
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  evaluatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true
  },
  communication: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  teamwork: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  leadership: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  problemSolving: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ""
  },
  isStaffEvaluation: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one evaluation per evaluator-evaluated pair
evaluationSchema.index({ evaluatorId: 1, evaluatedUserId: 1 }, { unique: true });

module.exports = mongoose.model("Evaluation", evaluationSchema);
