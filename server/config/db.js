const { Sequelize } = require("sequelize");

// Support passing a full URI connection string (common in Render, Neon, Supabase)
const sequelize = process.env.DB_URI
  ? new Sequelize(process.env.DB_URI, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: "postgres", // Switched to postgres
        logging: false,
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL Database Connected via Sequelize");
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };