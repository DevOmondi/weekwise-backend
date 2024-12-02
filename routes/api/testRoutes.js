const express = require("express");
const trialMessageGenerator = require("../../utils/trialMessageGenerator");
const { sendTrialEmail } = require("../../mailing/sendEmail");

const testRoutes = () => {
  const testRouter = express.Router();

  testRouter.route("/test-email").post(async (req, res) => {
    try {
      const { userName, prompt, userEmail } = req.body;
      const context = {
        userName: userName || "User",
        goal: prompt,
        // similarGoalUsers: 120,
      };
      const trialMessage = await trialMessageGenerator.generateTrialMessage(context);

      await sendTrialEmail(userEmail, userName, trialMessage)

      res.json({
        success: true,
        message: trialMessage,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return testRouter;
};

module.exports = testRoutes;