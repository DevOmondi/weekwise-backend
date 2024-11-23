const express = require("express");
const cors = require("cors");
const cron = require('node-cron');
const { sequelize } = require("./models");
require("dotenv").config();

const {generateAndSendEmail} = require('./mailing/sendEmail');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://www.weekwise.me');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


const corsOptions = {
  origin: 'https://www.weekwise.me',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

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
  await generateAndSendEmail();
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("server is running on port::", PORT);
});
