const express = require("express");
require("dotenv").config();

const { User } = require("../../models");
const createUser = require("../../controllers/userControllers");

const { sendRegistrationEmail } = require("../../mailing/sendEmail");
const messageGenerator = require("../../utils/messageGenerator");

const registerRoutes = () => {
  const registerRouter = express.Router();

  registerRouter.route("/register").post(async (req, res) => {
    try {
      const { prompt, userName, userEmail } = req.body;

      // Check if the user already exists
      const existingUser = await User.findOne({ where: { email: userEmail.toLowerCase() } });
      console.log(existingUser);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "A user with this email already exists.",
        });
      }

      // Count total users in the database
      const totalUsers = await User.count();

      // Generate the AI response using messageGenerator
      const aiResponse = await messageGenerator.generateMessage({
        userName,
        goal: prompt,
        weekNumber: 1,
        previousMessages: [],
        totalUsers: totalUsers,
        similarGoalUsers: await User.count({ where: { prompt } }),
      });

      const previousMessages = [aiResponse];

      await createUser(userName, userEmail, prompt, previousMessages);

      // Send the email
      await sendRegistrationEmail(userEmail, userName, aiResponse);

      res.status(200).json({ success: true, message: aiResponse });
    } catch (error) {
      console.error("Error with user registration:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to register user.",
      });
    }
  });

  return registerRouter;
};

module.exports = registerRoutes;
