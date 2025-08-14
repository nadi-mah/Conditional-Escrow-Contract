const { putPayerCompletionRequest, putPayeeCompletionRequest } = require("../controllers/requestCompletion.controller");
const express = require("express");
const router = express.Router();

router.route("/:agreementId/request-completion-payer").put(putPayerCompletionRequest);
router.route("/:agreementId/request-completion-payee").put(putPayeeCompletionRequest);

module.exports = router;