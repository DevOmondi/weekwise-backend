const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");
const { User } = require("../../models");

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

  // Create payment
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
        return_url: "https://weekwise.vercel.app/",
        cancel_url: "https://weekwise.vercel.app/",
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

  // Capture payment
  paymentRouter.route("/capture-payment").post(async (req, res) => {
    const { orderId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
      const capture = await client.execute(request);

      // Extract payment details
      const paymentDetails =
        capture.result.purchase_units[0].payments.captures[0];
      const dateTime = new Date(paymentDetails.create_time);
      const transactionId = paymentDetails.id;
      // const amount =
      //   paymentDetails.amount.value + " " + paymentDetails.amount.currency_code;

      // Extract payer email
      const payerEmail = capture.result.payer.email_address;

      // Update the database with the paymentID and updatedAt for the user with matching email
      const [updated] = await User.update(
        {
          paymentID: transactionId,
          updatedAt: dateTime,
        },
        { where: { email: payerEmail } }
      );

      if (updated) {
        res.status(200).json({
          success: true,
          capture: {
            transactionId,
            dateTime,
            payerEmail,
            message: "User paymentID and updatedAt updated successfully",
          },
        });
      } else {
        res.status(404).json({
          success: false,
          message: "User with the provided email not found",
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return paymentRouter;
};

module.exports = paymentRoutes;
