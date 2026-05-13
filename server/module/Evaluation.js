const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Evaluation = sequelize.define("Evaluation", {
  evaluatorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  evaluatedUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  communication: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  teamwork: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  leadership: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  problemSolving: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comment: {
    type: DataTypes.TEXT,
    defaultValue: ""
  },
  isStaffEvaluation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["evaluatorId", "evaluatedUserId"]
    }
  ]
});

module.exports = Evaluation;
