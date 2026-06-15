const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Team = sequelize.define("Team", {
  teamName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  experientialCategory: {
    type: DataTypes.ENUM("VIP", "P2BL", "EPICS"),
    allowNull: true
  }
}, { timestamps: true });

module.exports = Team;
