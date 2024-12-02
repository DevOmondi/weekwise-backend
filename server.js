const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { sequelize } = require("./models");
require("dotenv").config();

const { sendDueEmails } = require("./mailing/sendEmail");

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use('*',cors(corsOptions));
app.use(express.json());

// Route handler
app.use(require("./routes"));

// DB connection
sequelize
  .authenticate()
  .then(() => console.log("Database connected!"))
  .catch((err) => console.error("Database connection error:", err));

app.get("/", (req, res) => {
  res.send("Welcome to weekwise");
});

// Schedule the job to run every minute
cron.schedule("* * * * *", async () => {
  console.log("Running email job at", new Date().toISOString());
  await sendDueEmails()
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("server is running on port::", PORT);
});
