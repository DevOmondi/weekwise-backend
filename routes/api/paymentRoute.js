const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");
const messageGenerator = require("../../utils/messageGenerator");
const createUser = require("../../controllers/userControllers");
const sendWelcomeEmail = require("../../mailing/sendEmail")

// PayPal Environment Configuration
const environment =
  process.env.NODE_ENV === "production"
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      );

const client = new paypal.core.PayPalHttpClient(environment);

const paymentRoutes = () => {
  const paymentRouter = express.Router();

  // Create payment route
  paymentRouter.route("/create-payment").post(async (req, res) => {
    const { amount, currency, description } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency || "USD",
            value: amount,
          },
          description: description || "One-time payment",
        },
      ],
      application_context: {
        return_url: "https://weekwise.me/",
        cancel_url: "https://weekwise.me/",
      },
    });

    try {
      const order = await client.execute(request);
      res.status(200).json({ success: true, orderId: order.result.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Capture payment route
  paymentRouter.route("/capture-payment").post(async (req, res) => {
    const { orderId, formData } = req.body;
    const { name, email, goal } = formData;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
      const capture = await client.execute(request);

      // Extract payment details
      const paymentDetails = capture.result.purchase_units[0].payments.captures[0];
      const subscriptionDate = new Date(paymentDetails.create_time);
      const paymentID = paymentDetails.id;

      // Calculate next message date (one day after subscription)
      const nextMessageDate = new Date(subscriptionDate);
      nextMessageDate.setDate(nextMessageDate.getDate() + 1);

      // Generate context for message generation
      const context = {
        userName: name,
        goal,
      };

      // Generate the 52 messages
      const scheduledMessages = await messageGenerator.generateAllMessages(context);

      // Create new user with all required fields
      await createUser(
        name,
        email,
        goal,
        paymentID,
        scheduledMessages,
        subscriptionDate,
        nextMessageDate
      );
      
      // welcomeEmailContext
      const welcomeEmailContext = {
        userName: name,
        userEmail: email,
        goal,
        nextMessageDate
      }
      // Send welcome email
      await sendWelcomeEmail(welcomeEmailContext)

      // Send success response
      res.status(200).json({
        success: true,
        capture: {
          transactionId: paymentID,
          nextMessageDate,
          message: "Payment processed and user created successfully",
        },
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return paymentRouter;
};

module.exports = paymentRoutes;