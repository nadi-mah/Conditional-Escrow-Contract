const { PrismaClient } = require('../generated/prisma')
const { StatusCodes } = require("http-status-codes");
const { validAddress } = require("../middlewares/validate");

const prisma = new PrismaClient();

const getPayerAgreements = async (req, res) => {
    try {
        const payerAddress = req.params.payerAddress;

        if (!validAddress(payerAddress)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Payer address in invalid." });
        }
        const agreements = await getAgreementsByRole("payer", payerAddress);

        if (!agreements.length) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "There is no agreement with this payer address." })
        }
        res.json({ agreements });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." });
        console.error(error);
    }
}
const getPayeeAgreements = async (req, res) => {
    try {
        const payeeAddress = req.params.payeeAddress;

        if (!validAddress(payeeAddress)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Payee address in invalid." });
        }
        const agreements = await getAgreementsByRole("payee", req.params.payeeAddress);

        if (!agreements.length) {
            res.status(StatusCodes.NOT_FOUND).json({ message: "There is no agreement with this payee address." })
        }
        res.json({ agreements });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error });
    }
}
const getAgreementsByRole = async (role, address) => {

    return prisma.agreement.findMany({
        where: { [role]: address },
        select: { title: true, amount: true, payer: true, payee: true, deadline: true, currentState: true }
    });
};
module.exports = { getPayerAgreements, getPayeeAgreements };