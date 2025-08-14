const { PrismaClient } = require("../generated/prisma")
const { StatusCodes } = require("http-status-codes");

const prisma = new PrismaClient();

const putCancelAgreement = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);

    // state validation
    // payer validation

    try {
        await prisma.agreement.update({
            where: { id: agreementId },
            data: { currentState: "Canceled" }
        })
        res.status(StatusCodes.OK).json({ message: "Agreement cancellation successful." })
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." })
    }

}
const putExtendDuration = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);
    const { deadline } = req.body;

    // state validation
    // payer validation

    try {
        await prisma.agreement.update({
            where: { id: agreementId },
            data: { deadline: new Date(deadline) }
        })
        res.status(StatusCodes.OK).json({ message: "Duration extension successful." })

    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." })
    }
}

module.exports = { putCancelAgreement, putExtendDuration }