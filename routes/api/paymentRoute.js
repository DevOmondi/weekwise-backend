const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");
const messageGenerator = require("../../utils/messageGenerator");
const createUser = require("../../controllers/userControllers");
const { sendWelcomeEmail } = require("../../mailing/sendEmail");

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

  // Simulate subscription activation
  // paymentRouter.route("/simulate-subscription").post(async (req, res) => {
  //   const { formData } = req.body;
  //   const { name, email, goal } = formData;

  //   try {
  //     // Create mock subscription data first
  //     const mockSubscriptionId = `TEST_SUB_${Date.now()}`;
  //     const subscriptionDate = new Date();
  //     const nextMessageDate = new Date(subscriptionDate);
  //     nextMessageDate.setDate(nextMessageDate.getDate() + 1);

  //     const subscriptionDetails = {
  //       status: "ACTIVE",
  //     };

  //     // Send success response immediately after subscription details are ready
  //     res.status(200).json({
  //       success: true,
  //       subscription: {
  //         subscriptionId: mockSubscriptionId,
  //         status: "ACTIVE",
  //         nextMessageDate,
  //         message: "Test subscription activated successfully",
  //       },
  //     });

  //     const welcomeEmailContext = {
  //       userName: name,
  //       userEmail: email,
  //       goal,
  //       nextMessageDate,
  //     };
  //     await sendWelcomeEmail(welcomeEmailContext);

  //     // Continue with remaining operations asynchronously
  //     const context = {
  //       userName: name,
  //       goal,
  //     };

  //     const scheduledMessages = await messageGenerator.generateAllMessages(
  //       context
  //     );

  //     // Create new user with test subscription
  //     const subscriptionStatus = subscriptionDetails.status;
  //     const subscriptionId = mockSubscriptionId;
  //     const dbUsername = name;
  //     const isSubscribed = true;

  //     await createUser(
  //       dbUsername,
  //       email,
  //       goal,
  //       subscriptionId,
  //       scheduledMessages,
  //       subscriptionDate,
  //       nextMessageDate,
  //       isSubscribed,
  //       subscriptionStatus
  //     );
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ success: false, error: err.message });
  //   }
  // });

  // Simulate subscription status changes
  // paymentRouter.route("/simulate-subscription-update").post(async (req, res) => {
  //   const { subscriptionId, newStatus } = req.body;

  //   try {
  //     // Validate status
  //     const validStatuses = ['ACTIVE', 'CANCELLED', 'SUSPENDED'];
  //     if (!validStatuses.includes(newStatus)) {
  //       throw new Error('Invalid subscription status');
  //     }

  //     // Update user subscription status
  //     // Implement your database update logic here
  //     // await User.findOneAndUpdate(
  //     //   { subscriptionId },
  //     //   { subscriptionStatus: newStatus },
  //     //   { new: true }
  //     // );

  //     res.status(200).json({
  //       success: true,
  //       message: `Subscription ${subscriptionId} status updated to ${newStatus}`,
  //     });

  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ success: false, error: err.message });
  //   }
  // });

  // const generateAccessToken = async () => {
  //   try {
  //     const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  //     const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

  //     if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  //       throw "Paypal credentials not found";
  //     }

  //     const auth = Buffer.from(
  //       PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
  //     ).toString("base64");
  //     console.log("Auth is::", { auth });

  //     const url = `${process.env.PAYPAL_BASE_TEST}/v1/oauth2/token`;

  //     const response = await fetch(url, {
  //       method: "POST",
  //       body: "grant_type=client_credentials",
  //       headers: {
  //         Authorization: `Bearer ${auth}`,
  //       },
  //     });

  //     const data = await response.json();
  //     return data;
  //   } catch (error) {
  //     console.log("Error occured generating token::", error);
  //     throw error;
  //   }
  // };

  // // Test in sandbox
  // paymentRouter.route("/test-create-subscription").post(async (req, res) => {
  //   // Sandbox
  //   const accessToken = await generateAccessToken();
  //   console.log("Still getting auth token::", { accessToken });
  //   const { plan_name } = req.body;
  //   const url = `${process.env.PAYPAL_BASE_TEST}/v1/billing/subscriptions`;

  //   const response = await fetch(url, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Accept: "application/json",
  //       Prefer: "return=representation",
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //     body: JSON.stringify({
  //       plan_name,
  //       application_context: {
  //         user_action: "SUBSCRIBE_NOW",
  //       },
  //     }),
  //   });

  //   const data = response.json;
  //   res
  //     .status(200)
  //     .json({ success: true, PaypalSubscription: data, status: data.status });
  // });

  // Activate subscription route
  paymentRouter.route("/activate-subscription").post(async (req, res) => {
    const { subscriptionId, formData } = req.body;
    const { name, email, goal } = formData;

    try {
      // Create a request to get subscription details
      const request = {
        requestBody: {},
        path: `/v1/billing/subscriptions/${subscriptionId}`,
        verb: "GET",
      };
      const subscription = await client.execute(request);

      // Check subscription status
      if (subscription.result.status !== "ACTIVE") {
        throw new Error("Subscription is not active");
      }

      const subscriptionDetails = subscription.result;
      const subscriptionDate = new Date(subscriptionDetails.start_time);

      // Calculate next message date (one day after subscription start)
      const nextMessageDate = new Date(subscriptionDate);
      nextMessageDate.setDate(nextMessageDate.getDate() + 1);

      // Send success response
      res.status(200).json({
        success: true,
        subscription: {
          subscriptionId,
          status: subscriptionDetails.status,
          nextMessageDate,
          message: "Subscription activated and user created successfully",
        },
      });

      // welcomeEmailContext
      const welcomeEmailContext = {
        userName: name,
        userEmail: email,
        goal,
        nextMessageDate,
      };

      // Send welcome email
      await sendWelcomeEmail(welcomeEmailContext);

      // Generate context for message generation
      const context = {
        userName: name,
        goal,
      };

      // Generate the 52 messages
      const scheduledMessages = await messageGenerator.generateAllMessages(
        context
      );

      // Create new user with all required fields
      const subscriptionStatus = subscriptionDetails.status;
      const dbUsername = name;
      const isSubscribed = true;

      await createUser(
        dbUsername,
        email,
        goal,
        subscriptionId,
        scheduledMessages,
        subscriptionDate,
        nextMessageDate,
        isSubscribed,
        subscriptionStatus
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Webhook route to handle subscription updates
  // paymentRouter.route("/subscription-webhook").post(async (req, res) => {
  //   try {
  //     const webhookEvent = req.body;
  //     const eventType = webhookEvent.event_type;
  //     const resourceId = webhookEvent.resource.id;

  //     switch (eventType) {
  //       case "BILLING.SUBSCRIPTION.CANCELLED":
  //         // Handle subscription cancellation
  //         // Update user subscription status in database
  //         await updateUserSubscriptionStatus(resourceId, "CANCELLED");
  //         break;

  //       case "BILLING.SUBSCRIPTION.SUSPENDED":
  //         // Handle subscription suspension (e.g., failed payment)
  //         await updateUserSubscriptionStatus(resourceId, "SUSPENDED");
  //         break;

  //       case "BILLING.SUBSCRIPTION.RENEWED":
  //         // Handle successful renewal
  //         await updateUserSubscriptionStatus(resourceId, "ACTIVE");
  //         break;
  //     }

  //     res.status(200).send("Webhook processed successfully");
  //   } catch (err) {
  //     console.error("Webhook Error:", err);
  //     res.status(500).json({ error: err.message });
  //   }
  // });

  // // Helper function to update user subscription status
  // async function updateUserSubscriptionStatus(subscriptionId, status) {
  //   // Implement this function to update the user's subscription status in your database
  //   // This will depend on your database schema and ORM
  //   try {
  //     // Example:
  //     // await User.findOneAndUpdate(
  //     //   { subscriptionId },
  //     //   { subscriptionStatus: status },
  //     //   { new: true }
  //     // );
  //   } catch (err) {
  //     console.error("Error updating subscription status:", err);
  //     throw err;
  //   }
  // }

  return paymentRouter;
};

module.exports = paymentRoutes;
