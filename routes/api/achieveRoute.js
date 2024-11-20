const express = require("express");
const { OpenAI } = require("openai");
require("dotenv").config();

const { sendAchievementEmail } = require("../../mailing/sendEmail");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

const achieveRoutes = () => {
  const achieveRouter = express.Router();

  achieveRouter.route("/achieve").post(async (req, res) => {
    try {
      const { prompt, userName, userEmail } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
You are a motivational coach helping users achieve their goals. 
Write a personalized response in an encouraging and professional tone. 
Include specific advice, steps, or habits the user can adopt to achieve their goal. 
Address the user by their name if provided and keep the response concise (no more than 200 words).`,
          },
          {
            role: "user",
            content: `
User's Name: ${userName || "User"}.
User's Goal: ${prompt}.
Write a motivational response that provides encouragement, actionable advice, and finishes with a positive call-to-action.`,
          },
        ],
      });

      let aiResponse = response.choices[0].message.content;
      aiResponse = aiResponse.replace(/\n\n/g, " ");

      res.status(200).json({ success: true, message: aiResponse });
      return sendAchievementEmail(userEmail, userName, aiResponse);
    } catch (error) {
      console.error("Error with OpenAI API:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate a response.",
      });
    }
  });

  return achieveRouter;
};

module.exports = achieveRoutes;
