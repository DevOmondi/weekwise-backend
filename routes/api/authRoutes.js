const express = require("express");
const { sendWelcomeEmail } = require("../../mailing/sendEmail");

const authRoutes = () => {
  const authRouter = express.Router();

  authRouter.route("/register").post(async (req, res) => {
    try {
      const { email, name } = req.body;
      await sendWelcomeEmail(email, name);

      res.json({
        success: true,
        message: "User registered and welcome email sent",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return authRouter;
};

module.exports = authRoutes;
