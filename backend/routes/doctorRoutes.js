const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const authenticateToken = require("../middlewares/authenticateToken");


router.get("/profile",authenticateToken, doctorController.getDoctorProfile);

router.put("/updateprofile",authenticateToken, doctorController.updateDoctorProfile);

module.exports = router;