const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const authenticateToken = require("../middlewares/authenticateToken");
const validate = require('../middlewares/validate');
const { body, check } = require('express-validator');

router.post("/addpatient", [
    body('name').isAlpha('en-US', {ignore: ' '}).withMessage('Name must contain only alphabetic characters '),
    body('imageURL').isURL().withMessage('Please enter a valid URL'),
    body('age').isNumeric().withMessage('Enter valid age'),
    body('sex').isAlpha().withMessage('Enter valid sex'),
    body('address').isString().withMessage('Enter valid address'),
    body('height').isNumeric().withMessage('Enter valid height'),
    body('weight').isNumeric().withMessage('Enter valid weight'),
], validate, patientController.addPatient);


router.put("/updaterecentappointment", [
    body('patientId').isNumeric().withMessage('Enter valid patient id'),
    check('recentAppointmentDate').isISO8601().withMessage('Invalid date format. Use ISO 8601 format.'),
], validate, authenticateToken, patientController.updateRecentAppointment);


router.post("/all",[
    body('sex').isString().withMessage('Enter valid sex'),
    body('consultlocation').isString().withMessage('Enter valid consultation location'),
    body('treatmentStatus').isString().withMessage('Enter valid treatmentStatus'),
], validate, authenticateToken,patientController.getPatients);


router.put("/updatepatient", authenticateToken, patientController.updatePatient);

router.post("/singlepatient",validate,authenticateToken, patientController.getPatientById);

module.exports = router;
