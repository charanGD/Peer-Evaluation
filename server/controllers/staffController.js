const Evaluation = require("../module/Evaluation");
const User = require("../module/user");
const Team = require("../module/Team");

// ==================== GET MY STUDENTS ====================
const getMyStudents = async (req, res) => {
  try {

    // ==================== PAGINATION + SEARCH ====================
    const page =
      parseInt(req.query.page) || 1;

    const limit =
      parseInt(req.query.limit) || 5;

    const skip =
      (page - 1) * limit;

    const search =
      req.query.search || "";

    // ==================== FIND TEAM ====================
    const team =
      await Team.findOne({
        staffId: req.user._id
      }).lean();

    if (!team) {
      return res.status(400).json({
        message:
          "No team assigned to you"
      });
    }

    // ==================== GET STUDENTS ====================
    const students =
      await User.find({
        teamId: team._id,

        role: "student",

        name: {
          $regex: search,
          $options: "i"
        }
      })

      .select(
        "name userId teamId role"
      )

      .skip(skip)

      .limit(limit)

      .lean();

    // ==================== GET EVALUATIONS ====================
    const evaluations =
      await Evaluation.find({
        teamId: team._id
      })

      .populate(
        "evaluatorId",
        "name userId role"
      )

      .populate(
        "evaluatedUserId",
        "name userId"
      )

      .lean();

    // ==================== STAFF EVALUATED ====================
    const staffEvaluated =
      await Evaluation.find({
        evaluatorId: req.user._id,

        isStaffEvaluation: true
      }).lean();

    const staffEvaluatedIds =
      staffEvaluated.map((e) =>
        e.evaluatedUserId.toString()
      );

    // ==================== STUDENT DATA ====================
    const studentData =
      students.map((student) => {

        const peerEvals =
          evaluations.filter((e) =>
            e.evaluatedUserId &&
            e.evaluatedUserId._id.toString() ===
              student._id.toString() &&
            !e.isStaffEvaluation
          );

        const staffEval =
          staffEvaluated.find((e) =>
            e.evaluatedUserId.toString() ===
            student._id.toString()
          );

        let peerAvg = 0;

        if (peerEvals.length > 0) {

          const total =
            peerEvals.reduce(
              (sum, e) =>
                sum +
                (
                  e.communication +
                  e.teamwork +
                  e.leadership +
                  e.problemSolving
                ) / 4,
              0
            );

          peerAvg = parseFloat(
            (
              total /
              peerEvals.length
            ).toFixed(2)
          );
        }

        return {
          _id: student._id,

          name: student.name,

          userId: student.userId,

          peerAvg,

          peerCount:
            peerEvals.length,

          staffEvaluated:
            staffEvaluatedIds.includes(
              student._id.toString()
            ),

          staffMarks:
            staffEval
              ? {
                  communication:
                    staffEval.communication,

                  teamwork:
                    staffEval.teamwork,

                  leadership:
                    staffEval.leadership,

                  problemSolving:
                    staffEval.problemSolving,

                  avg: parseFloat(
                    (
                      (
                        staffEval.communication +
                        staffEval.teamwork +
                        staffEval.leadership +
                        staffEval.problemSolving
                      ) / 4
                    ).toFixed(2)
                  )
                }
              : null
        };

      });

    // ==================== RESPONSE ====================
    res.json({
      team: {
        _id: team._id,
        teamName: team.teamName
      },

      students: studentData,

      evaluationMatrix: evaluations
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== SUBMIT STAFF EVALUATION ====================
const submitStaffEvaluation = async (req, res) => {
  try {

    const {
      evaluatedUserId,
      communication,
      teamwork,
      leadership,
      problemSolving,
      comment
    } = req.body;

    // ==================== VERIFY TEAM ====================
    const team =
      await Team.findOne({
        staffId: req.user._id
      }).lean();

    if (!team) {
      return res.status(400).json({
        message:
          "No team assigned to you"
      });
    }

    // ==================== VERIFY STUDENT ====================
    const student =
      await User.findById(
        evaluatedUserId
      ).lean();

    if (
      !student ||
      !student.teamId ||
      student.teamId.toString() !==
        team._id.toString()
    ) {
      return res.status(400).json({
        message:
          "This student is not in your team"
      });
    }

    // ==================== CHECK EXISTING ====================
    const existing =
      await Evaluation.findOne({
        evaluatorId: req.user._id,

        evaluatedUserId,

        isStaffEvaluation: true
      }).lean();

    if (existing) {
      return res.status(400).json({
        message:
          "You have already evaluated this student"
      });
    }

    // ==================== CREATE EVALUATION ====================
    const evaluation =
      await Evaluation.create({
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

    res.status(201).json({
      message:
        "Staff evaluation submitted",

      evaluation
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Already evaluated this student"
      });
    }

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== SAVE FINAL MARKS ====================
const saveFinalMarks = async (req, res) => {
  try {

    const FinalMark =
      require("../module/finalMark");

    const marks = req.body;

    await FinalMark.insertMany(marks);

    res.json({
      message:
        "Marks stored successfully"
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};

module.exports = {
  getMyStudents,
  submitStaffEvaluation,
  saveFinalMarks
};