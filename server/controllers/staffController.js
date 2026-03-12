const Evaluation = require("../module/Evaluation");
const User = require("../module/user");
const Team = require("../module/Team");

// Get students for the staff's assigned team
const getMyStudents = async (req, res) => {
  try {
    // Find team where this staff is assigned
    const team = await Team.findOne({ staffId: req.user._id });
    if (!team) {
      return res.status(400).json({ message: "No team assigned to you" });
    }

    const students = await User.find({ teamId: team._id, role: "student" })
      .select("-password");

    // Get evaluations for each student
    const evaluations = await Evaluation.find({ teamId: team._id })
      .populate("evaluatorId", "name userId role")
      .populate("evaluatedUserId", "name userId");

    // Check which students the staff has already evaluated
    const staffEvaluated = await Evaluation.find({
      evaluatorId: req.user._id,
      isStaffEvaluation: true
    });
    const staffEvaluatedIds = staffEvaluated.map(e => e.evaluatedUserId.toString());

    // Calculate peer averages for each student
    const studentData = students.map(student => {
      const peerEvals = evaluations.filter(e =>
        e.evaluatedUserId._id.toString() === student._id.toString() && !e.isStaffEvaluation
      );
      const staffEval = staffEvaluated.find(e =>
        e.evaluatedUserId.toString() === student._id.toString()
      );

      let peerAvg = 0;
      if (peerEvals.length > 0) {
        const total = peerEvals.reduce((sum, e) =>
          sum + (e.communication + e.teamwork + e.leadership + e.problemSolving) / 4, 0
        );
        peerAvg = parseFloat((total / peerEvals.length).toFixed(2));
      }

      return {
        _id: student._id,
        name: student.name,
        userId: student.userId,
        peerAvg,
        peerCount: peerEvals.length,
        staffEvaluated: staffEvaluatedIds.includes(student._id.toString()),
        staffMarks: staffEval ? {
          communication: staffEval.communication,
          teamwork: staffEval.teamwork,
          leadership: staffEval.leadership,
          problemSolving: staffEval.problemSolving,
          avg: parseFloat(((staffEval.communication + staffEval.teamwork + staffEval.leadership + staffEval.problemSolving) / 4).toFixed(2))
        } : null
      };
    });

    res.json({
      team: { _id: team._id, teamName: team.teamName },
      students: studentData,
      evaluationMatrix: evaluations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Staff submits evaluation for a student
const submitStaffEvaluation = async (req, res) => {
  try {
    const { evaluatedUserId, communication, teamwork, leadership, problemSolving, comment } = req.body;

    // Verify staff has a team
    const team = await Team.findOne({ staffId: req.user._id });
    if (!team) {
      return res.status(400).json({ message: "No team assigned to you" });
    }

    // Verify student is in the team
    const student = await User.findById(evaluatedUserId);
    if (!student || !student.teamId || student.teamId.toString() !== team._id.toString()) {
      return res.status(400).json({ message: "This student is not in your team" });
    }

    // Check if already evaluated
    const existing = await Evaluation.findOne({
      evaluatorId: req.user._id,
      evaluatedUserId,
      isStaffEvaluation: true
    });
    if (existing) {
      return res.status(400).json({ message: "You have already evaluated this student" });
    }

    const evaluation = await Evaluation.create({
      evaluatorId: req.user._id,
      evaluatedUserId,
      teamId: team._id,
      communication,
      teamwork,
      leadership,
      problemSolving,
      comment: comment || "",
      isStaffEvaluation: true
    });

    res.status(201).json({ message: "Staff evaluation submitted", evaluation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Already evaluated this student" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Save final marks (legacy support)
const saveFinalMarks = async (req, res) => {
  try {
    const FinalMark = require("../module/finalMark");
    const marks = req.body;
    await FinalMark.insertMany(marks);
    res.json({ message: "Marks stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMyStudents, submitStaffEvaluation, saveFinalMarks };