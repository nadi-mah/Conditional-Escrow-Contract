const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());

// Connect Routers
const getAgreementsRouter = require("./routes/getAgreementsList.route");
const postAgreementRouter = require("./routes/createAgreement.route");
const getAgreementDetailRouter = require("./routes/getAgreementDetail.route");
const updateRequestCompletionRouter = require("./routes/requestCompletion.route");
const updateRequestDisputeRouter = require("./routes/raiseDispute.route");
const updateAgreementRouter = require("./routes/updateAgreement.route");
const updateReleaseFundsRouter = require("./routes/releaseFunds.route");
const deleteAgreementRouter = require("./routes/deleteAgreement.route");

app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use("/agreements", getAgreementsRouter);
app.use("/agreements", postAgreementRouter);
app.use("/agreements", getAgreementDetailRouter);
app.use("/agreements", updateRequestCompletionRouter);
app.use("/agreements", updateRequestDisputeRouter);
app.use("/agreements", updateAgreementRouter);
app.use("/agreements", updateReleaseFundsRouter);
app.use("/agreements", deleteAgreementRouter);

app.listen(3000, () => console.log('Server running on port 3000'));
