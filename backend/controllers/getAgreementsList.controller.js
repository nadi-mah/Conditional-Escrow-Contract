const { PrismaClient } = require('../generated/prisma')
const { StatusCodes } = require("http-status-codes");
const { validAddress } = require("../middlewares/validate");

const prisma = new PrismaClient();


const getPayerAgreements = async (req, res) => {
    try {
        const payerAddress = req.params.payerAddress;

        const validationResult = validAddress(payerAddress, "payer");
        if (!validationResult.status) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: validationResult.message });
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

        const validationResult = validAddress(payeeAddress, "payee");
        if (!validationResult.status) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: validationResult.message });
        }
        const agreements = await getAgreementsByRole("payee", payeeAddress);

        if (!agreements.length) {
            res.status(StatusCodes.NOT_FOUND).json({ message: "There is no agreement with this payee address." })
        }
        res.json({ agreements });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." });
    }
}
const getArbiterAgreements = async (req, res) => {
    try {
        const arbiterAddress = req.params.arbiterAddress;

        const validationResult = validAddress(arbiterAddress, "arbiter");
        if (!validationResult.status) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: validationResult.message });
        }
        const agreements = await prisma.agreement.findMany({
            where: { arbiter: arbiterAddress },
            select: { title: true, amount: true, deadline: true, currentState: true, disputeWinner: true }
        })

        if (!agreements) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "There is no agreement with this arbiter address." })
        }

        const { disputeCount, resolveCount } = agreements.reduce((acc, agreement) => {
            if (agreement.currentState === "InDispute") acc.disputeCount++;
            if (agreement.currentState === "Completed" && agreement.disputeWinner) acc.resolveCount++;
            return acc
        },
            { disputeCount: 0, resolveCount: 0 }
        );

        res.json({
            agreements: agreements,
            disputeCount: disputeCount,
            resolveCount: resolveCount
        });

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error." });
    }
}

const getAgreementsByRole = async (role, address) => {

    return prisma.agreement.findMany({
        where: { [role]: address },
        select: { id: true, title: true, amount: true, payer: true, payee: true, deadline: true, currentState: true }
    });
};
module.exports = { getPayerAgreements, getPayeeAgreements, getArbiterAgreements };