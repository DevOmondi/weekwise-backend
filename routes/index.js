const router = require("express").Router();

const testRoutes = require("./api/testRoutes")();
const registerRoutes = require("./api/registerRoute")();
const paymentRoutes = require("./api/paymentRoute")();

router.use("/api/test", testRoutes);
router.use("/api/model", registerRoutes);
router.use("/api/payment", paymentRoutes);

module.exports = router;
