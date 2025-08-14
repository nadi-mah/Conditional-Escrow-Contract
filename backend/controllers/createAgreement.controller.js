const { PrismaClient } = require("../generated/prisma")
const { StatusCodes } = require("http-status-codes");

const { validAddress, validAmount, validDeadline, validPayer } = require("../middlewares/validate");

const prisma = new PrismaClient();

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const postAgreement = async (req, res) => {
    const { onChainId, title, detail, payer, payee, arbiter, amount, deadline } = req.body;

    const parties = [
        { name: "payer", address: payer },
        { name: "payee", address: payee },
        { name: "arbiter", address: arbiter },
    ]
    for (const party of parties) {
        const addressValidation = validAddress(party.address, party.name);
        if (!addressValidation.status) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: addressValidation.message });
        }
    }
    const amountValidation = validAmount(amount);
    if (!amountValidation) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: amountValidation.message });
    }

    // onchainId validation is skipped for now
    // deadline validation is skipped for now

    try {
        const agreement = await prisma.agreement.create({
            data: { onChainId, title, detail, payer, payee, arbiter, amount, deadline: new Date(deadline), currentState: "Funded" }
        });
        res.json({ agreement })
    } catch (error) {
        res.status(500).json({ message: error })
    }



}

module.exports = { postAgreement }