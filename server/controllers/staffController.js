const { Evaluation, User, Team, FinalMark } = require("../module");

// Get students for the staff's assigned team
const getMyStudents = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const team = await Team.findOne({ where: { staffId: userId } });
    if (!team) {
      return res.status(400).json({ message: "No team assigned to you" });
    }

    const students = await User.findAll({
      where: { teamId: team.id, role: "student" },
      attributes: { exclude: ["password"] }
    });

    const evaluations = await Evaluation.findAll({
      where: { teamId: team.id },
      include: [
        { model: User, as: "evaluator", attributes: ["name", "userId", "role"] },
        { model: User, as: "evaluated", attributes: ["name", "userId"] }
      ]
    });

    const staffEvaluated = await Evaluation.findAll({
      where: { evaluatorId: userId, isStaffEvaluation: true }
    });
    const staffEvaluatedIds = staffEvaluated.map(e => e.evaluatedUserId);

    const studentData = students.map(student => {
      const peerEvals = evaluations.filter(e => e.evaluatedUserId === student.id && !e.isStaffEvaluation);
      const staffEval = staffEvaluated.find(e => e.evaluatedUserId === student.id);

      let peerAvg = 0;
      if (peerEvals.length > 0) {
        const total = peerEvals.reduce((sum, e) =>
          sum + (e.communication + e.teamwork + e.leadership + e.problemSolving) / 4, 0);
        peerAvg = parseFloat((total / peerEvals.length).toFixed(2));
      }

      return {
        _id: student.id, name: student.name, userId: student.userId,
        peerAvg, peerCount: peerEvals.length,
        staffEvaluated: staffEvaluatedIds.includes(student.id),
        staffMarks: staffEval ? {
          communication: staffEval.communication, teamwork: staffEval.teamwork,
          leadership: staffEval.leadership, problemSolving: staffEval.problemSolving,
          avg: parseFloat(((staffEval.communication + staffEval.teamwork + staffEval.leadership + staffEval.problemSolving) / 4).toFixed(2))
        } : null
      };
    });

    res.json({ team: { _id: team.id, teamName: team.teamName }, students: studentData, evaluationMatrix: evaluations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Staff submits evaluation for a student
const submitStaffEvaluation = async (req, res) => {
  try {
    const { evaluatedUserId, communication, teamwork, leadership, problemSolving, comment } = req.body;
    const evaluatorId = req.user.id || req.user._id;

    const team = await Team.findOne({ where: { staffId: evaluatorId } });
    if (!team) return res.status(400).json({ message: "No team assigned to you" });

    const student = await User.findByPk(evaluatedUserId);
    if (!student || !student.teamId || student.teamId !== team.id) {
      return res.status(400).json({ message: "This student is not in your team" });
    }

    const existing = await Evaluation.findOne({
      where: { evaluatorId, evaluatedUserId, isStaffEvaluation: true }
    });
    if (existing) return res.status(400).json({ message: "You have already evaluated this student" });

    const evaluation = await Evaluation.create({
      evaluatorId, evaluatedUserId, teamId: team.id,
      communication, teamwork, leadership, problemSolving,
      comment: comment || "", isStaffEvaluation: true
    });

    res.status(201).json({ message: "Staff evaluation submitted", evaluation });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Already evaluated this student" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Save final marks
const saveFinalMarks = async (req, res) => {
  try {
    const marks = req.body;
    await FinalMark.bulkCreate(marks);
    res.json({ message: "Marks stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyStudents, submitStaffEvaluation, saveFinalMarks };