const { PrismaClient } = require("../generated/prisma")
const { StatusCodes } = require("http-status-codes");

const { validPayee, validArbiter } = require("../middlewares/validate");

const prisma = new PrismaClient();

const deleteAgreement = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);
    // payee validation
    // state validation

    try {
        await prisma.agreement.delete({
            where: { id: agreementId },
        })
        res.status(StatusCodes.OK).json({ message: "Agreement deletion successful." })
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." })
    }
}

module.exports = { deleteAgreement }