const { putPayerReleaseFunds } = require("../controllers/releaseFunds.controller");
const express = require("express");
const router = express.Router();

router.route("/:agreementId/release-funds").put(putPayerReleaseFunds);

module.exports = router;