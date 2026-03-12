const Evaluation = require("../module/Evaluation");
const User = require("../module/user");

// Submit evaluation for a teammate (peer)
const submitEvaluation = async (req, res) => {
  try {
    const { evaluatedUserId, communication, teamwork, leadership, problemSolving, comment } = req.body;
    const evaluatorId = req.user._id;

    if (evaluatorId.toString() === evaluatedUserId) {
      return res.status(400).json({ message: "You cannot evaluate yourself" });
    }

    const evaluator = await User.findById(evaluatorId);
    if (!evaluator.teamId) {
      return res.status(400).json({ message: "You are not assigned to any team" });
    }

    const evaluatedUser = await User.findById(evaluatedUserId);
    if (!evaluatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!evaluatedUser.teamId || evaluatedUser.teamId.toString() !== evaluator.teamId.toString()) {
      return res.status(400).json({ message: "You can only evaluate your own teammates" });
    }

    const existingEvaluation = await Evaluation.findOne({ evaluatorId, evaluatedUserId });
    if (existingEvaluation) {
      return res.status(400).json({ message: "You have already evaluated this teammate" });
    }

    const ratings = [communication, teamwork, leadership, problemSolving];
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Each rating must be between 1 and 5" });
      }
    }

    const evaluation = await Evaluation.create({
      evaluatorId,
      evaluatedUserId,
      teamId: evaluator.teamId,
      communication,
      teamwork,
      leadership,
      problemSolving,
      comment: comment || "",
      isStaffEvaluation: false
    });

    res.status(201).json({ message: "Evaluation submitted successfully", evaluation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already evaluated this teammate" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get evaluations received by the logged-in user (peer + staff)
const getMyEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ evaluatedUserId: req.user._id })
      .populate("evaluatorId", "name userId role")
      .populate("teamId", "teamName");

    // Separate peer and staff evaluations
    const peerEvals = evaluations.filter(e => !e.isStaffEvaluation);
    const staffEvals = evaluations.filter(e => e.isStaffEvaluation);

    // Calculate peer averages
    let peerAvg = { communication: 0, teamwork: 0, leadership: 0, problemSolving: 0 };
    if (peerEvals.length > 0) {
      peerEvals.forEach(e => {
        peerAvg.communication += e.communication;
        peerAvg.teamwork += e.teamwork;
        peerAvg.leadership += e.leadership;
        peerAvg.problemSolving += e.problemSolving;
      });
      const c = peerEvals.length;
      peerAvg.communication = parseFloat((peerAvg.communication / c).toFixed(2));
      peerAvg.teamwork = parseFloat((peerAvg.teamwork / c).toFixed(2));
      peerAvg.leadership = parseFloat((peerAvg.leadership / c).toFixed(2));
      peerAvg.problemSolving = parseFloat((peerAvg.problemSolving / c).toFixed(2));
    }
    peerAvg.overall = parseFloat(((peerAvg.communication + peerAvg.teamwork + peerAvg.leadership + peerAvg.problemSolving) / 4).toFixed(2));

    // Staff marks
    let staffMarks = null;
    if (staffEvals.length > 0) {
      const se = staffEvals[0];
      staffMarks = {
        evaluator: se.evaluatorId ? se.evaluatorId.name : "Staff",
        communication: se.communication,
        teamwork: se.teamwork,
        leadership: se.leadership,
        problemSolving: se.problemSolving,
        overall: parseFloat(((se.communication + se.teamwork + se.leadership + se.problemSolving) / 4).toFixed(2)),
        comment: se.comment
      };
    }

    res.json({
      peerEvaluations: peerEvals,
      staffEvaluation: staffMarks,
      peerAverages: peerAvg,
      totalPeerCount: peerEvals.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get evaluations submitted by the logged-in user
const getSubmittedEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ evaluatorId: req.user._id, isStaffEvaluation: false })
      .populate("evaluatedUserId", "name userId")
      .populate("teamId", "teamName");
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitEvaluation, getMyEvaluations, getSubmittedEvaluations };
