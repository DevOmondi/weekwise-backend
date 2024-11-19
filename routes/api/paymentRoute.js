const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");

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
  //   Create payment
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
      res.status(200).json({ success: true, capture: capture.result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return paymentRouter;
};

module.exports = paymentRoutes;
