const nodemailer = require("nodemailer");
require("dotenv").config();

// Mailing
const transport = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

// Email sending utility function
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: "hello@demomailtrap.com",
      to,
      subject,
      text,
      html,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Welcome email template
const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = "Welcome to Our Platform!";
  const html = `
        <h1>Welcome, ${userName}!</h1>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>Here are some things you can do to get started:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Explore our features</li>
          <li>Connect with other users</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `Welcome, ${userName}! Thank you for joining our platform.`,
  });
};

const sendAchievementEmail = async (userEmail, userName, aiResponse) => {
  const subject = "Psst! Got a message for you";
  const html = `
        <h1>Welcome, ${userName}!</h1>
        <p>Thank you for joining our Weekwise!. We're excited to have you on board!</p>
        <p>Here is what to expect weekly :)</p>
        <p>${aiResponse}</p>
        <p>You are doing well, ${userName}! Thank you for choosing to be part of this!.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      `;
  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `You are doing well, ${userName}! Thank you for choosing to be part of this!.`,
  });
};
module.exports = { sendWelcomeEmail, sendAchievementEmail };
