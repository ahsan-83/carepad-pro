const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require('../middlewares/validate');
const { body, header } = require('express-validator');
const authenticateToken = require("../middlewares/authenticateToken");


router.post("/register", [
    body('name').isAlpha('en-US', {ignore: ' '}).withMessage('Name must contain only alphabetic characters '),
    body('email').isEmail().withMessage('Email is invalid'),
    body('imageURL').isURL().withMessage('Please enter a valid URL'),
    body('bmdc').isString().withMessage("Enter valid bmdc"),
    body('specialty').isAlpha().withMessage("Enter valid specialty"),
    body('address').isString().withMessage('Enter valid address'),
    body('phone').isNumeric().withMessage('Enter valid phone number'),
    body('affiliation').isString().withMessage('Enter valid affiliation'),
    body('consultlocation').isString().withMessage('Enter valid consultation location'),
    body('password').isLength({ min: 6, max: 10 }).withMessage("Password must have minimum 6 characters and maximum 10 characters "),
    body('bmdc').isLength({min: 10, max: 10}).withMessage("BMDC must have 10 characters ")
],validate, authController.register);


router.post("/login", [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage("Valid password is required "),
    body('password').isLength({ min: 6, max: 10 }).withMessage("Password must have minimum 6 characters and maximum 10 characters "),
], validate, authController.login);


router.post("/refresh", authenticateToken, authController.refreshToken);

  
module.exports = router;
