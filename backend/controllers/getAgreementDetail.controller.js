const { PrismaClient } = require("../generated/prisma")
const { StatusCodes } = require("http-status-codes");

const prisma = new PrismaClient();

const getAgreementDetail = async (req, res) => {
    const agreementId = parseInt(req.params.agreementId);

    try {
        const agreement = await prisma.agreement.findUnique({
            where: { id: agreementId }
        })
        if (!agreement) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "There is no agreement with this id." })
        }
        return res.json({ agreement })
    } catch (error) {
        console.error(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." })
    }

}

module.exports = { getAgreementDetail }