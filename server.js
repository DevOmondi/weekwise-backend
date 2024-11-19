const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Route handler
app.use(require("./routes"));

app.get("/", (req, res) => {
  res.send("Welcome to weekwise");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log("server is running on port::", PORT);
});
