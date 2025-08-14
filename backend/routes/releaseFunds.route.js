const { putPayerReleaseFunds } = require("../controllers/releaseFunds.controller");
const express = require("express");
const router = express.Router();

router.route("/releaseFunds/:agreementId").put(putPayerReleaseFunds);

module.exports = router;