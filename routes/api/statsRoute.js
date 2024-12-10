const express = require("express");
const { User } = require("../../models");
const verifyToken = require("../../lib/authMiddleware");

const statsRoutes = () => {
  const statsRouter = express.Router();

  statsRouter.route("/users-count").get(verifyToken, async (req, res) => {
    try {
      const userCount = await User.count({
        where: {
          isSubscribed: true,
          subscriptionStatus: "ACTIVE",
        },
      });

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

  statsRouter.route("/users-details").get(verifyToken, async (req, res) => {
    try {
      // Fetch all user details
      const users = await User.findAll();

      // Add a derived progress property
      const usersWithProgress = users.map((user) => {
        const scheduledMessagesLength = user.scheduled_messages
          ? user.scheduled_messages.length
          : 52;
        return {
          ...user.toJSON(),
          progress: 52 - scheduledMessagesLength,
        };
      });

      
      return res.status(200).json(usersWithProgress);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users", error });
    }
  });

  return statsRouter;
};

module.exports = statsRoutes;
