const User = require("./user");
const Team = require("./Team");
const Evaluation = require("./Evaluation");
const FinalMark = require("./finalMark");

User.belongsTo(Team, { foreignKey: "teamId" });
Team.hasMany(User, { foreignKey: "teamId" });

Team.belongsTo(User, { as: "creator", foreignKey: "createdBy" });
Team.belongsTo(User, { as: "staff", foreignKey: "staffId" });

Evaluation.belongsTo(User, { as: "evaluator", foreignKey: "evaluatorId" });
Evaluation.belongsTo(User, { as: "evaluated", foreignKey: "evaluatedUserId" });
Evaluation.belongsTo(Team, { foreignKey: "teamId" });

module.exports = { User, Team, Evaluation, FinalMark };
