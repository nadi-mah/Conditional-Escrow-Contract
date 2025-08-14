const { putPayerCompletionRequest, putPayeeCompletionRequest } = require("../controllers/requestCompletion.controller");
const express = require("express");
const router = express.Router();

router.route("/payerConfirm/:agreementId").put(putPayerCompletionRequest);
router.route("/payeeConfirm/:agreementId").put(putPayeeCompletionRequest);

module.exports = router;