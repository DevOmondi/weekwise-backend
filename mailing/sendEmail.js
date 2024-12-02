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

const sendTrialEmail = async (userEmail, userName, trialMessage) => {
  const subject = "Psst!👋 Got a message for you";
  const html = `
        <h1>Hey There, ${userName}!</h1>
        <p>Thank you for trying out Weekwise!</p>
        <p>Here is what to expect weekly :)</p>
        <p>${trialMessage}</p>
        <p>You are doing well, ${userName}! Thank you for choosing to be part of this!</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `You are a hero, ${userName}! Thank you for checking us out!.`,
  });
};

const sendWelcomeEmail = (welcomeEmailContext) => {
  const dateTime = welcomeEmailContext.nextMessageDate
  const dateObj = dateTime ? new Date(dateTime) : null;
  const formattedTime = dateObj
    ? dateObj.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const subject = "Welcome to WeekWise! Your journey begins today";
  const html = `
  <h1>Hi ${welcomeEmailContext.userName},</h1>
  <p> Thank you for joining WeekWise! We're excited to help you ${(welcomeEmailContext.goal).toLowerCase()}.</p>
  <p>
  What's next:
    • Your first coaching message arrives tomorrow at ${formattedTime}
    • You'll receive weekly guidance for the next 52 weeks
    • Each message includes personalized advice and actionable steps

    Got questions? Just reply to this email.

    We're honored to be part of your journey,
    The WeekWise Team
  </p>`;
  return sendEmail({
    to: welcomeEmailContext.userEmail,
    subject,
    html,
    text: `You are a hero, ${welcomeEmailContext.userName}! We're honored to be part of your journey`,
  });
};
// Function to generate and send email
// const generateAndSendEmail = async () => {
//   try {
//     const currentDate = new Date();

//     const oneWeekAgo = new Date(currentDate);
//     oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

//     const exactStartTime = oneWeekAgo.toISOString();
//     const exactEndTime = currentDate.toISOString();

//     // Find all users who made payments exactly one week ago
//     const users = await User.findAll({
//       where: {
//         updatedAt: {
//           [Op.between]: [exactStartTime, exactEndTime],
//         },
//         paymentID: {
//           [Op.ne]: null,
//         },
//       },
//     });

//     if (!users || users.length === 0) {
//       console.log(
//         "No users found who paid exactly one week ago at the current time."
//       );
//       return;
//     }

//     for (const user of users) {
//       const {
//         name: userName,
//         email: userEmail,
//         prompt,
//         previous_messages,
//       } = user;

//       if (!userEmail || !userName) {
//         console.log(`Skipping user due to missing data:`, user);
//         continue;
//       }

//       const previousMessages = Array.isArray(previous_messages)
//         ? previous_messages
//         : JSON.parse(previous_messages || "[]");

//       // Generate the motivational message using messageGenerator
//       const aiResponse = await messageGenerator.generateMessage({
//         userName,
//         goal: prompt,
//         weekNumber: weekNumber + 1,
//         previousMessages,
//         totalUsers: await User.count(),
//         similarGoalUsers: await User.count({ where: { prompt } }),
//       });

//       previousMessages.push(aiResponse);
//       user.previous_messages = JSON.stringify(previousMessages);
//       await user.save();

//       // Send the email
//       await sendWeeklyEmail(userEmail, userName, aiResponse);
//       console.log(`Weekly email sent to ${userEmail}`);
//     }
//   } catch (error) {
//     console.error("Error in generateAndSendEmail:", error);
//   }
// };

// Function to send out due emails
const sendDueEmails = async () => {
  try {
    const currentDate = new Date();

    // Find users whose nextMessageDate matches current time
    const users = await User.findAll({
      where: {
        nextMessageDate: {
          [Op.lte]: currentDate,
        },
        scheduled_messages: {
          [Op.ne]: null,
        },
      },
    });

    if (!users || users.length === 0) {
      console.log("No messages due at current time.");
      return;
    }

    for (const user of users) {
      const { name: userName, email: userEmail, scheduled_messages } = user;

      if (!userEmail || !userName) {
        console.log(`Skipping user due to missing data:`, user);
        continue;
      }

      try {
        // Parse scheduled messages
        const messages = JSON.parse(scheduled_messages || "[]");

        if (messages.length === 0) {
          console.log(`No remaining messages for user: ${userEmail}`);
          continue;
        }

        // Get the next message (first in array)
        const nextMessage = messages[0];

        // First try to send the email
        try {
          await sendWeeklyEmail(userEmail, userName, nextMessage);

          // Only after successful email sending:
          // Remove the sent message and update scheduledMessages
          const updatedMessages = messages.slice(1);

          // Calculate next message date (exactly one week later)
          const nextMessageDate = new Date(user.nextMessageDate);
          nextMessageDate.setDate(nextMessageDate.getDate() + 7);

          // Update user record
          user.scheduled_messages = JSON.stringify(updatedMessages);
          user.nextMessageDate = nextMessageDate;
          await user.save();

          console.log(
            `Weekly email sent to ${userEmail}, next message scheduled for ${nextMessageDate}`
          );
        } catch (emailError) {
          console.error(`Failed to send email to ${userEmail}:`, emailError);
          // Don't update the messages array or nextMessageDate if email fails
          // This way it will try again on the next cron run
          continue;
        }
      } catch (error) {
        console.error(`Error processing user ${userEmail}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error("Error in sendDueEmails:", error);
  }
};

module.exports = {
  sendWeeklyEmail,
  sendTrialEmail,
  sendWelcomeEmail,
  sendDueEmails,
};
