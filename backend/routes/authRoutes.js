const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate").default;
const { body, header } = require("express-validator");
const authenticateToken = require("../middlewares/authenticateToken");

router.post("/register",authController.register);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Valid password is required"),
  ],
  validate,
  authController.login
);

router.post("/refresh", authenticateToken, authController.refreshToken);

module.exports = router;
