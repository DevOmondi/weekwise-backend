const express = require("express");
const { User } = require("../../models");
const verifyToken = require("../../lib/authMiddleware");

const statsRoutes = () => {
  const statsRouter = express.Router();

  statsRouter.route("/users-count").get(verifyToken, async (req, res) => {
    try {
      const userCount = await User.count();

      res.status(200).json({
        success: true,
        count: userCount,
      });
    } catch (error) {
      console.error("Error counting users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to count users",
      });
    }
  });
  return statsRouter;
};

module.exports = statsRoutes;
