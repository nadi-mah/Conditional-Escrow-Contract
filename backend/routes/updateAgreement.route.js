const { putCancelAgreement, putExtendDuration } = require("../controllers/updateAgreement.controller");
const express = require("express");
const router = express.Router();

router.route("/:agreementId/cancel-expired").put(putCancelAgreement);
router.route("/:agreementId/extend-duration").put(putExtendDuration);

module.exports = router;