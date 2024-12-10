const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { sequelize } = require("./models");
require("dotenv").config();

const { sendDueEmails } = require("./mailing/sendEmail");

const app = express();

// Allowed origins
const allowedOrigins = [
  "https://weekwise.me",
  "https://admin.weekwise.me",
  "https://www.weekwise.me",
  "http://localhost:3000",
  "http://localhost:3001"
];

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  await sendDueEmails();
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log("server is running on port::", PORT);
});
