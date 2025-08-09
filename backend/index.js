const express = require('express');
const { PrismaClient } = require('./generated/prisma')

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

BigInt.prototype.toJSON = function () {
    return this.toString();
};

app.post('/agreements', async (req, res) => {
    const { onChainId, title, detail, payer, payee, arbiter, amount, deadline, currentState, payerConfirmed, payeeConfirmed } = req.body;
    const agreement = await prisma.agreement.create({
        data: { onChainId, title, detail, payer, payee, arbiter, amount, deadline: new Date(deadline), currentState, payerConfirmed, payeeConfirmed }
    });
    res.json(agreement);
});


app.get('/agreements', async (req, res) => {
    const agreements = await prisma.agreement.findMany();
    res.json(agreements);
});

app.listen(3000, () => console.log('Server running on port 3000'));
