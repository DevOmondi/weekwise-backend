const router = require("express").Router();

const authRoutes = require("./api/authRoutes")();
const registerRoutes = require("./api/registerRoute")();
const paymentRoutes = require("./api/paymentRoute")();

router.use("/api/auth", authRoutes);
router.use("/api/model", registerRoutes);
router.use("/api/payment", paymentRoutes);

module.exports = router;
