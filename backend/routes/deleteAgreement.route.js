const { deleteAgreement } = require("../controllers/deleteAgreement.controller");
const express = require("express");
const router = express.Router();

router.route("/deleteAgreement/:agreementId").delete(deleteAgreement);

module.exports = router;