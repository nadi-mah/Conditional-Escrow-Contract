const { putCancelAgreement, putExtendDuration } = require("../controllers/putAgreementEdit.controller");
const express = require("express");
const router = express.Router();

router.route("/cancelAgreement/:agreementId").put(putCancelAgreement);
router.route("/extendDuration/:agreementId").put(putExtendDuration);

module.exports = router;