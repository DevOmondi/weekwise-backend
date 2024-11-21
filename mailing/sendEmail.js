const { Resend } = require("resend");
const { OpenAI } = require("openai");
const { User } = require("../models");
const { Op } = require("sequelize");
const messageGenerator = require("../utils/messageGenerator");
require("dotenv").config();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Email sending utility function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const response = await resend.emails.send({
      from: "you@weekwise.me",
      to,
      subject,
      html,
      text,
    });

    // console.log("Email sent:", response.id);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Weekly email template
const sendWeeklyEmail = async (userEmail, userName, aiResponse) => {
  const subject = "It's us, weekwise 😉!";
  const html = `
        <h1>Hey There, ${userName}!</h1>
        <p>Your journey with us is truly valued, and we’re thrilled to have you on board. 🎉</p>
        <p>${aiResponse}</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `Thank you, ${userName}, for being part of this.`,
  });
};

const sendRegistrationEmail = async (userEmail, userName, aiResponse) => {
  const subject = "Psst!👋 Got a message for you";
  const html = `
        <h1>Welcome, ${userName}!</h1>
        <p>Thank you for joining Weekwise! We're excited to have you on board!</p>
        <p>Here is what to expect weekly :)</p>
        <p>${aiResponse}</p>
        <p>You are doing well, ${userName}! Thank you for choosing to be part of this!</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `You are a hero, ${userName}! Thank you for choosing to be part of this!.`,
  });
};

// Function to generate and send email
const generateAndSendEmail = async () => {
  try {
    const currentDate = new Date();

    const oneWeekAgo = new Date(currentDate);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const exactStartTime = oneWeekAgo.toISOString();
    const exactEndTime = currentDate.toISOString();

    // Find all users who made payments exactly one week ago
    const users = await User.findAll({
      where: {
        updatedAt: {
          [Op.between]: [exactStartTime, exactEndTime], 
        },
        paymentID: {
          [Op.ne]: null, 
        },
      },
    });

    if (!users || users.length === 0) {
      console.log(
        "No users found who paid exactly one week ago at the current time."
      );
      return;
    }

    for (const user of users) {
      const {
        name: userName,
        email: userEmail,
        prompt,
        previous_messages,
      } = user;

      if (!userEmail || !userName) {
        console.log(`Skipping user due to missing data:`, user);
        continue;
      }

      const previousMessages = Array.isArray(previous_messages)
        ? previous_messages
        : JSON.parse(previous_messages || "[]");

      // Generate the motivational message using messageGenerator
      const aiResponse = await messageGenerator.generateMessage({
        userName,
        goal: prompt,
        weekNumber: weekNumber + 1,
        previousMessages,
        totalUsers: await User.count(),
        similarGoalUsers: await User.count({ where: { prompt } }),
      });

      previousMessages.push(aiResponse);
      user.previous_messages = JSON.stringify(previousMessages);
      await user.save();

      // Send the email
      await sendWeeklyEmail(userEmail, userName, aiResponse);
      console.log(`Weekly email sent to ${userEmail}`);
    }
  } catch (error) {
    console.error("Error in generateAndSendEmail:", error);
  }
};


module.exports = {
  sendWeeklyEmail,
  sendRegistrationEmail,
  generateAndSendEmail,
};
