const { Evaluation, User, Team } = require("../module");

// Submit evaluation for a teammate (peer)
const submitEvaluation = async (req, res) => {
  try {
    const { evaluatedUserId, communication, teamwork, leadership, problemSolving, comment } = req.body;
    const evaluatorId = req.user.id || req.user._id;

    if (evaluatorId.toString() === evaluatedUserId.toString()) {
      return res.status(400).json({ message: "You cannot evaluate yourself" });
    }

    const evaluator = await User.findByPk(evaluatorId);
    if (!evaluator.teamId) {
      return res.status(400).json({ message: "You are not assigned to any team" });
    }

    const evaluatedUser = await User.findByPk(evaluatedUserId);
    if (!evaluatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!evaluatedUser.teamId || evaluatedUser.teamId.toString() !== evaluator.teamId.toString()) {
      return res.status(400).json({ message: "You can only evaluate your own teammates" });
    }

    const existingEvaluation = await Evaluation.findOne({ where: { evaluatorId, evaluatedUserId } });
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
      evaluatorId, evaluatedUserId,
      teamId: evaluator.teamId,
      communication, teamwork, leadership, problemSolving,
      comment: comment || "",
      isStaffEvaluation: false
    });

    res.status(201).json({ message: "Evaluation submitted successfully", evaluation });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "You have already evaluated this teammate" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get evaluations received by the logged-in user (peer + staff)
const getMyEvaluations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const evaluations = await Evaluation.findAll({
      where: { evaluatedUserId: userId },
      include: [
        { model: User, as: "evaluator", attributes: ["name", "userId", "role"] },
        { model: Team, attributes: ["teamName"] }
      ]
    });

    const peerEvals = evaluations.filter(e => !e.isStaffEvaluation);
    const staffEvals = evaluations.filter(e => e.isStaffEvaluation);

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

    let staffMarks = null;
    if (staffEvals.length > 0) {
      const se = staffEvals[0];
      staffMarks = {
        evaluator: se.evaluator ? se.evaluator.name : "Staff",
        communication: se.communication, teamwork: se.teamwork,
        leadership: se.leadership, problemSolving: se.problemSolving,
        overall: parseFloat(((se.communication + se.teamwork + se.leadership + se.problemSolving) / 4).toFixed(2)),
        comment: se.comment
      };
    }

    res.json({ peerEvaluations: peerEvals, staffEvaluation: staffMarks, peerAverages: peerAvg, totalPeerCount: peerEvals.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get evaluations submitted by the logged-in user
const getSubmittedEvaluations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const evaluations = await Evaluation.findAll({
      where: { evaluatorId: userId, isStaffEvaluation: false },
      include: [
        { model: User, as: "evaluated", attributes: ["name", "userId"] },
        { model: Team, attributes: ["teamName"] }
      ]
    });
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitEvaluation, getMyEvaluations, getSubmittedEvaluations };