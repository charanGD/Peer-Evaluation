const { User, Team } = require("./server/module");
const { sequelize } = require("./server/config/db");
async function test() {
  const users = await User.findAll({ where: { role: 'student' } });
  console.log(users[0].toJSON());
  process.exit();
}
test();
