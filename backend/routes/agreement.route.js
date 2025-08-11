const { getPayerAgreements, getPayeeAgreements } = require("../controllers/agreement.controller");
const express = require("express");
const router = express.Router();

router.route("/payer/:payerAddress").get(getPayerAgreements);
router.route("/payee/:payeeAddress").get(getPayeeAgreements);

module.exports = router;