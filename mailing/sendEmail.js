const { Resend } = require("resend");
// const { OpenAI } = require("openai");
const { User } = require("../models");
const { Op } = require("sequelize");
// const messageGenerator = require("../utils/messageGenerator");
require("dotenv").config();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   organization: process.env.OPENAI_ORG_ID,
// });

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
const sendWeeklyEmail = async (userEmail, userName, nextMessage) => {
   // Extract subject and content from the message
   const extractSubjectAndContent = (message) => {
    const subjectMatch = message.match(/^Subject:\s*(.*)$/m);
    const subject = subjectMatch ? subjectMatch[1].trim() : "Weekly Update from Weekwise"; // Default subject
    const content = message.replace(/^Subject:\s*.*$/m, "").trim(); // Remove subject line and keep content
    return { subject, content };
  };

  const { subject, content } = extractSubjectAndContent(fullMessage);
  // const subject = "It's us, weekwise 😉!";
  const html = `<p>${content}</p>`;

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
  const dateTime = welcomeEmailContext.nextMessageDate;
  const dateObj = dateTime ? new Date(dateTime) : null;
  const formattedTime = dateObj
    ? dateObj.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const subject = "Welcome to WeekWise! Your journey begins today";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #36b552ff; margin-bottom: 20px;">Hi ${
        welcomeEmailContext.userName
      },</h1>
      
      <p style="color: #000000; font-size: 16px; line-height: 1.5;">
        Thank you for joining WeekWise! We're excited to help you with your goal: ${welcomeEmailContext.goal.toLowerCase()}.
      </p>

      <h2 style="color: #36b552ff; margin: 25px 0 15px;">What's next:</h2>
      <ul style="color: #000000; font-size: 16px; line-height: 1.6;">
        <li>Your first coaching message arrives tomorrow at ${formattedTime}</li>
        <li>You'll receive weekly guidance for the next 52 weeks</li>
        <li>Each message includes personalized advice and actionable steps</li>
      </ul>

      <p style="color: #000000; font-size: 16px; margin: 25px 0;">
        Got questions? Just reply to this email.
      </p>

      <p style="color: #000000; font-size: 16px; margin-top: 30px;">
        We're honored to be part of your journey,<br>
        The WeekWise Team
      </p>
    </div>
  `;
  return sendEmail({
    to: welcomeEmailContext.userEmail,
    subject,
    html,
    text: `You are a hero, ${welcomeEmailContext.userName}! We're honored to be part of your journey`,
  });
};

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
        isSubscribed: true,
        subscriptionStatus: "ACTIVE",
        scheduled_messages: {
          [Op.ne]: null,
        },
      },
    });

    if (!users || users.length === 0) {
      console.log("No messages due at the current time.");
      return;
    }

    for (const user of users) {
      const { name: userName, email: userEmail, scheduled_messages } = user;

      if (!userEmail || !userName) {
        console.log(`Skipping user due to missing data:`, user);
        continue;
      }

      try {
        // Scheduled messages are already an array of strings
        const messages = scheduled_messages || [];

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
          user.scheduled_messages = updatedMessages;
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
