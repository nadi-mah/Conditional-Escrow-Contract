const { PrismaClient } = require("../generated/prisma")
const { StatusCodes } = require("http-status-codes");

const { validPayer, validPayee, validArbiter } = require("../middlewares/validate");

const prisma = new PrismaClient();

// maybe split the payer and payee request dispute functions
const putRaiseDispute = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);
    // payer validation
    // payee validation
    // state validation

    try {
        await prisma.agreement.update({
            where: { id: agreementId },
            data: { currentState: "InDispute" }
        })
        res.status(StatusCodes.OK).json({ message: "Dispute request successful." })
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." })
    }
}

const putResolveDispute = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);
    const { winner } = req.body;
    // arbiter validation
    // winner validation
    // state validation

    try {
        await prisma.agreement.update({
            where: { id: agreementId },
            data: { currentState: "Completed", disputeWinner: winner }
        })
        res.status(StatusCodes.OK).json({ message: "Dispute resolved." })
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." })
    }
}

module.exports = { putRaiseDispute, putResolveDispute }