const express = require("express");
const router = express.Router();
const consultationController = require("../controllers/consultationController");
const authenticateToken = require("../middlewares/authenticateToken");
const validate = require('../middlewares/validate');
const { body, check } = require('express-validator');


router.post("/addconsultation",[
    body('patientId').isNumeric().withMessage('Enter valid patient id'),
    body('consultlocation').isString().withMessage('Enter valid consultation location'),
    body('consultType').isString().withMessage('Enter valid consultation type'),
    body('patientCondition').isString().withMessage('Enter valid patient condition'),
    body('consultationFee').isNumeric().withMessage('Enter valid consultation fee'),
    body('appointmentStatus').isAlpha().withMessage('Enter valid appointment status'),
],validate, consultationController.addConsultation);


router.post("/getappointments",[
    body('consultlocation').isAlpha().withMessage('Enter valid consultation location'),
    body('consultType').isAlpha().withMessage('Enter valid consultation type'),
    body('appointmentStatus').isAlpha().withMessage('Enter valid appointment status'),
], validate,authenticateToken, consultationController.getAppointments);

router.put("/cancelappointment",[
    body('appointmentId').isNumeric().withMessage('Enter valid id'),
], validate,authenticateToken, consultationController.cancelAppointment);

router.put("/update",[
    body('id').isNumeric().withMessage('Enter valid id'),
], validate,authenticateToken, consultationController.updateConsultation);

router.post("/getnotes",[
    body('consultlocation').isString().withMessage('Enter valid consultation location'),
    body('consultType').isString().withMessage('Enter valid consultation type'),
    body('disease').isString().withMessage('Enter valid disease'),
],validate,authenticateToken, consultationController.getNotes);

router.post("/all",[
    body('consultationId').isNumeric().withMessage("Enter valid consultationId"),
    body('patientId').isNumeric().withMessage("Enter valid patientId"),
],validate,authenticateToken, consultationController.getAllConsultations);

router.get("/:id",[
],validate,authenticateToken, consultationController.getSingleConsultation);

module.exports = router;