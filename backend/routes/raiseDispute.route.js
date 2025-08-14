const { putRaiseDispute, putResolveDispute } = require("../controllers/raiseDispute.controller");
const express = require("express");
const router = express.Router();

router.route("/:agreementId/raise-dispute").put(putRaiseDispute);
router.route("/:agreementId/resolve-dispute").put(putResolveDispute);

module.exports = router;