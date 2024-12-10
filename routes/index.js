const router = require("express").Router();

const testRoutes = require("./api/testRoutes")();
const authRoutes = require("./api/authRoute")();
const paymentRoutes = require("./api/paymentRoute")();
const statsRoutes = require("./api/statsRoute")();

router.use("/api/test", testRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/payment", paymentRoutes);
router.use("/api/stats", statsRoutes);

module.exports = router;
