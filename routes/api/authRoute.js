const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { Admin } = require("../../models");

const authRoutes = () => {
  const authRouter = express.Router();

  authRouter.route("/login").post(async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Email and password are required" });
      }

      // Check if admin exists
      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        return res
          .status(404)
          .json({ success: false, message: "Admin not found" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: admin.id, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        success: true,
        message: "Admin successfully logged in",
        token,
      });
    } catch (error) {
      console.error("Error with admin login:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to login admin",
      });
    }
  });

  return authRouter;
};

module.exports = authRoutes;
