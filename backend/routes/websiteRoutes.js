const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const specialtyController = require("../controllers/specialtyController");
const experienceController = require("../controllers/experienceController");
const educationController = require("../controllers/educationController");
const certificateController = require("../controllers/certificateController");
const membershipController = require("../controllers/membershipController");
const awardController = require("../controllers/awardController");
const videoController = require("../controllers/videoController");
const socialmediaController = require("../controllers/socialmediaController");
const locationController = require("../controllers/locationController");
const contactController = require("../controllers/contactController");
const diseaseController = require("../controllers/diseaseController");
const galleryController = require("../controllers/galleryController");
const authenticateToken = require("../middlewares/authenticateToken");




router.post("/createProfile",authenticateToken, profileController.createProfile);

router.get("/getProfile", profileController.getProfile);

router.put("/updateProfile", authenticateToken, profileController.updateProfile);

router.post("/createSpecialty",authenticateToken, specialtyController.createSpecialty);

router.get("/getSpecialty", specialtyController.getSpecialty);

router.put("/updateSpecialty", authenticateToken, specialtyController.updateSpecialty);

router.post("/deleteSpecialty", authenticateToken, specialtyController.deleteSpecialty);

router.post("/createExperience",authenticateToken, experienceController.createExperience);

router.get("/getExperience", experienceController.getExperience);

router.put("/updateExperience", authenticateToken, experienceController.updateExperience);

router.post("/deleteExperience", authenticateToken, experienceController.deleteExperience);

router.post("/createEducation",authenticateToken, educationController.createEducation);

router.get("/getEducation", educationController.getEducation);

router.put("/updateEducation", authenticateToken, educationController.updateEducation);

router.post("/deleteEducation", authenticateToken, educationController.deleteEducation);

router.post("/createCertificate",authenticateToken, certificateController.createCertificate);

router.get("/getCertificate", certificateController.getCertificate);

router.put("/updateCertificate", authenticateToken, certificateController.updateCertificate);

router.post("/deleteCertificate", authenticateToken, certificateController.deleteCertificate);

router.post("/createMembership",authenticateToken, membershipController.createMembership);

router.get("/getMembership", membershipController.getMembership);

router.put("/updateMembership", authenticateToken, membershipController.updateMembership);

router.post("/deleteMembership", authenticateToken, membershipController.deleteMembership);

router.post("/createAward",authenticateToken, awardController.createAward);

router.get("/getAward", awardController.getAward);

router.put("/updateAward", authenticateToken, awardController.updateAward);

router.post("/deleteAward", authenticateToken, awardController.deleteAward);

router.post("/createVideo",authenticateToken, videoController.createVideo);

router.get("/getVideo", videoController.getVideo);

router.put("/updateVideo", authenticateToken, videoController.updateVideo);

router.post("/deleteVideo", authenticateToken, videoController.deleteVideo);

router.post("/createLocation",authenticateToken, locationController.createLocation);

router.get("/getLocation", locationController.getLocation);

router.put("/updateLocation", authenticateToken, locationController.updateLocation);

router.post("/deleteLocation", authenticateToken, locationController.deleteLocation);

router.post("/createContact",authenticateToken, contactController.createContact);

router.get("/getContact", contactController.getContact);

router.put("/updateContact", authenticateToken, contactController.updateContact);

router.post("/createDisease",authenticateToken, diseaseController.createDisease);

router.get("/getDisease", diseaseController.getDisease);

router.put("/updateDisease", authenticateToken, diseaseController.updateDisease);

router.post("/deleteDisease", authenticateToken, diseaseController.deleteDisease);

router.post("/createImage",authenticateToken, galleryController.createImage);

router.get("/getImage", galleryController.getImage);

router.post("/deleteImage", authenticateToken, galleryController.deleteImage);

router.post("/createProfileImage",authenticateToken, profileController.createProfileImage);

router.get("/getProfileImage", profileController.getProfileImage);

router.post("/deleteProfileImage", authenticateToken, profileController.deleteProfileImage);

router.post("/createSocialPost",authenticateToken, socialmediaController.createSocialPost);

router.get("/getSocialPost", socialmediaController.getSocialPost);

router.put("/updateSocialPost", authenticateToken, socialmediaController.updateSocialPost);

router.post("/deleteSocialPost", authenticateToken, socialmediaController.deleteSocialPost);


module.exports = router;
