const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const authenticateToken = require("../middlewares/authenticateToken");

router.get("/profile", authenticateToken, doctorController.getDoctorProfile);

router.put(
  "/updateprofile",
  authenticateToken,
  doctorController.updateDoctorProfile
);

// Create new location
router.post(
  "/addconsultations",
  authenticateToken,
  doctorController.addDoctorConsultations
);

// Fetch consultation locations
router.get("/consultations", doctorController.getConsultationLocations);

// Publish / Unpublish
router.put(
  "/publish-location",
  authenticateToken,
  doctorController.togglePublishLocation
);


router.put(
  "/updateconsultations/:id",
  authenticateToken,
  doctorController.updateConsultationLocation
);


router.delete(
  "/deleteconsultations/:id",
  authenticateToken,
  doctorController.deleteConsultationLocation
);

module.exports = router;
