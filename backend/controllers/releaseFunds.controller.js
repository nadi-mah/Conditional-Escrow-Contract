const { PrismaClient } = require("../generated/prisma")
const { StatusCodes } = require("http-status-codes");

const { validPayee, validArbiter } = require("../middlewares/validate");

const prisma = new PrismaClient();

const putPayerReleaseFunds = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);
    // payee validation
    // state validation

    try {
        await prisma.agreement.update({
            where: { id: agreementId },
            data: { currentState: "Completed" }
        })
        res.status(StatusCodes.OK).json({ message: "Funds released successfully." })
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." })
    }
}

module.exports = { putPayerReleaseFunds }