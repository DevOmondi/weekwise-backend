const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { sequelize } = require("./models");
require("dotenv").config();

const { sendDueEmails } = require("./mailing/sendEmail");

const app = express();

// Allowed origins
// const allowedOrigins = [
//   "https://weekwise.me",
//   "https://www.weekwise.me",
//   "http://localhost:3000",
// ];

// CORS middleware
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//   }
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, OPTIONS, PATCH"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Authorization, X-Requested-With, Accept, Origin"
//   );
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   res.setHeader("Access-Control-Max-Age", "86400");

//   // Handle preflight requests
//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }
//   next();
// });

app.use(cors());
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
