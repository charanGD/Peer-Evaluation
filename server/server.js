const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();   
connectDB();       

const app = express();
const cors = require("cors");
app.use(cors());

const staffRoutes = require("./routes/staffRoutes");

app.use("/api/staff", staffRoutes);
app.get("/", (req, res) => {
  res.send("Server is running ");
});

app.use(express.json());
app.use("/api/users", require("./routes/userRoutes"));


app.get("/", (req, res) => {
  res.send("Working da 🔥");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});