const { getAgreementDetail } = require("../controllers/getAgreementDetail.controller");
const express = require("express");
const router = express.Router();

router.route("/detail/:agreementId").get(getAgreementDetail);

module.exports = router;