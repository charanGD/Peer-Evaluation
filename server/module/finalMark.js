const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const FinalMark = sequelize.define("FinalMark", {
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reg: {
    type: DataTypes.STRING,
    allowNull: true
  },
  peerAverage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  mentorMark: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  finalTotal: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, { timestamps: false });

module.exports = FinalMark;