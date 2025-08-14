const { PrismaClient } = require("../generated/prisma")
const { StatusCodes } = require("http-status-codes");

const prisma = new PrismaClient();

const putPayerCompletionRequest = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);
    try {
        await prisma.agreement.update({
            where: { id: agreementId },
            data: { payerConfirmed: true }
        })
        res.status(StatusCodes.OK).json({ message: "Payer request successful." })
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." });
    }


}

const putPayeeCompletionRequest = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);
    try {
        await prisma.agreement.update({
            where: { id: agreementId },
            data: { payeeConfirmed: true }
        })
        res.status(StatusCodes.OK).json({ message: "Payee request successful." })
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." });
    }
}

module.exports = { putPayerCompletionRequest, putPayeeCompletionRequest } 