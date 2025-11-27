const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const authenticateToken = require("../middlewares/authenticateToken");
const validate = require("../middlewares/validate").default;
const { body, check } = require("express-validator");


router.post(
  "/all",
  authenticateToken,
  patientController.getPatients
);

router.put(
  "/updatepatient",
  authenticateToken,
  patientController.updatePatient
);

router.post(
  "/singlepatient",
  authenticateToken,
  patientController.getPatientById
);

// ✅ New route: fetch patient + their finished consultations (except current)
router.post(
  "/allconsultations",
  authenticateToken,
  patientController.getAllConsultationsWithPatient
);

module.exports = router;
