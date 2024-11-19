const router = require("express").Router();

const authRoutes = require("./api/authRoutes")();
const achieveRoutes = require("./api/achieveRoute")();
const paymentRoutes = require("./api/paymentRoute")();

router.use("/api/auth", authRoutes);
router.use("/api/model", achieveRoutes);
router.use("/api/payment", paymentRoutes);

module.exports = router;
