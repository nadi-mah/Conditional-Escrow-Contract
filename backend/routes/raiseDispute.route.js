const { putRaiseDispute, putResolveDispute } = require("../controllers/raiseDispute.controller");
const express = require("express");
const router = express.Router();

router.route("/disputeRequest/:agreementId").put(putRaiseDispute);
router.route("/disputeResolve/:agreementId").put(putResolveDispute);

module.exports = router;