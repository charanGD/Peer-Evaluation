const Evaluation = require("../module/Evaluation");
const User = require("../module/user");

// ==================== SUBMIT EVALUATION ====================
const submitEvaluation = async (req, res) => {
  try {

    const {
      evaluatedUserId,
      communication,
      teamwork,
      leadership,
      problemSolving,
      comment
    } = req.body;

    const evaluatorId =
      req.user._id;

    // ==================== SELF CHECK ====================
    if (
      evaluatorId.toString() ===
      evaluatedUserId
    ) {
      return res.status(400).json({
        message:
          "You cannot evaluate yourself"
      });
    }

    // ==================== EVALUATOR ====================
    const evaluator =
      await User.findById(
        evaluatorId
      ).lean();

    if (!evaluator.teamId) {
      return res.status(400).json({
        message:
          "You are not assigned to any team"
      });
    }

    // ==================== EVALUATED USER ====================
    const evaluatedUser =
      await User.findById(
        evaluatedUserId
      ).lean();

    if (!evaluatedUser) {
      return res.status(404).json({
        message:
          "User not found"
      });
    }

    if (
      !evaluatedUser.teamId ||

      evaluatedUser.teamId.toString() !==
        evaluator.teamId.toString()
    ) {
      return res.status(400).json({
        message:
          "You can only evaluate your own teammates"
      });
    }

    // ==================== EXISTING EVALUATION ====================
    const existingEvaluation =
      await Evaluation.findOne({
        evaluatorId,
        evaluatedUserId
      }).lean();

    if (existingEvaluation) {
      return res.status(400).json({
        message:
          "You have already evaluated this teammate"
      });
    }

    // ==================== VALIDATION ====================
    const ratings = [
      communication,
      teamwork,
      leadership,
      problemSolving
    ];

    for (const rating of ratings) {

      if (
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          message:
            "Each rating must be between 1 and 5"
        });
      }

    }

    // ==================== CREATE ====================
    const evaluation =
      await Evaluation.create({
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

    res.status(201).json({
      message:
        "Evaluation submitted successfully",

      evaluation
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You have already evaluated this teammate"
      });
    }

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== GET MY EVALUATIONS ====================
const getMyEvaluations = async (req, res) => {
  try {

    const evaluations =
      await Evaluation.find({
        evaluatedUserId:
          req.user._id
      })

      .populate(
        "evaluatorId",
        "name userId role"
      )

      .populate(
        "teamId",
        "teamName"
      )

      .lean();

    // ==================== SEPARATE ====================
    const peerEvals =
      evaluations.filter(
        (e) => !e.isStaffEvaluation
      );

    const staffEvals =
      evaluations.filter(
        (e) => e.isStaffEvaluation
      );

    // ==================== PEER AVERAGES ====================
    let peerAvg = {
      communication: 0,
      teamwork: 0,
      leadership: 0,
      problemSolving: 0
    };

    if (peerEvals.length > 0) {

      peerEvals.forEach((e) => {

        peerAvg.communication +=
          e.communication;

        peerAvg.teamwork +=
          e.teamwork;

        peerAvg.leadership +=
          e.leadership;

        peerAvg.problemSolving +=
          e.problemSolving;

      });

      const c = peerEvals.length;

      peerAvg.communication =
        parseFloat(
          (
            peerAvg.communication / c
          ).toFixed(2)
        );

      peerAvg.teamwork =
        parseFloat(
          (
            peerAvg.teamwork / c
          ).toFixed(2)
        );

      peerAvg.leadership =
        parseFloat(
          (
            peerAvg.leadership / c
          ).toFixed(2)
        );

      peerAvg.problemSolving =
        parseFloat(
          (
            peerAvg.problemSolving / c
          ).toFixed(2)
        );

    }

    peerAvg.overall =
      parseFloat(
        (
          (
            peerAvg.communication +
            peerAvg.teamwork +
            peerAvg.leadership +
            peerAvg.problemSolving
          ) / 4
        ).toFixed(2)
      );

    // ==================== STAFF MARKS ====================
    let staffMarks = null;

    if (staffEvals.length > 0) {

      const se = staffEvals[0];

      staffMarks = {
        evaluator:
          se.evaluatorId
            ? se.evaluatorId.name
            : "Staff",

        communication:
          se.communication,

        teamwork:
          se.teamwork,

        leadership:
          se.leadership,

        problemSolving:
          se.problemSolving,

        overall:
          parseFloat(
            (
              (
                se.communication +
                se.teamwork +
                se.leadership +
                se.problemSolving
              ) / 4
            ).toFixed(2)
          ),

        comment:
          se.comment
      };

    }

    res.json({
      peerEvaluations:
        peerEvals,

      staffEvaluation:
        staffMarks,

      peerAverages:
        peerAvg,

      totalPeerCount:
        peerEvals.length
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// ==================== GET SUBMITTED EVALUATIONS ====================
const getSubmittedEvaluations = async (req, res) => {
  try {

    const evaluations =
      await Evaluation.find({
        evaluatorId:
          req.user._id,

        isStaffEvaluation: false
      })

      .populate(
        "evaluatedUserId",
        "name userId"
      )

      .populate(
        "teamId",
        "teamName"
      )

      .sort({ createdAt: -1 })

      .lean();

    res.json(evaluations);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

module.exports = {
  submitEvaluation,
  getMyEvaluations,
  getSubmittedEvaluations
};