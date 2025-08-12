const express = require('express');
const { PrismaClient } = require('./generated/prisma')

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Connect Routers
const getAgreementsRouter = require("./routes/agreementsList.route");
const postAgreementRouter = require("./routes/createAgreement.route");

BigInt.prototype.toJSON = function () {
    return this.toString();
};

app.use("/agreements", getAgreementsRouter);
// app.use("/agreements", postAgreementRouter);

// app.post('/agreements', async (req, res) => {
//     const { onChainId, title, detail, payer, payee, arbiter, amount, deadline, currentState, payerConfirmed, payeeConfirmed } = req.body;
//     const agreement = await prisma.agreement.create({
//         data: { onChainId, title, detail, payer, payee, arbiter, amount, deadline: new Date(deadline), currentState, payerConfirmed, payeeConfirmed }
//     });
//     res.json(agreement);
// });


// app.get('/agreements', async (req, res) => {
//     const agreements = await prisma.agreement.findMany();
//     res.json(agreements);
// });

// app.delete('/agreements/:id', async (req, res) => {
//     try {
//         await prisma.agreement.delete({
//             where: { id: parseInt(req.params.id) }
//         });
//         res.json({ message: "Agreement deleted successfully" })

//     } catch (error) {
//         res.status(500).json({ errorMessage: error })
//     }

// })

app.listen(3000, () => console.log('Server running on port 3000'));
