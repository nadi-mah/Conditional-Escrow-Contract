const { getPayerAgreements, getPayeeAgreements, getArbiterAgreements } = require("../controllers/agreementsList.controller");
const express = require("express");
const router = express.Router();

router.route("/payer/:payerAddress").get(getPayerAgreements);
router.route("/payee/:payeeAddress").get(getPayeeAgreements);
router.route("/arbiter/:arbiterAddress").get(getArbiterAgreements);

module.exports = router;