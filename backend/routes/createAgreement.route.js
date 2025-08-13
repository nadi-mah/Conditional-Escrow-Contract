const { postAgreement } = require("../controllers/createAgreement.controller");
const express = require("express");
const router = express.Router();

router.route('/createAgreement').post(postAgreement);

module.exports = router;