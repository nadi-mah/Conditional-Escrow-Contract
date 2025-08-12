const { PrismaClient } = require("../generated/prisma")
const { StatusCodes } = require("http-status-codes");
const { validAddress } = require("../middlewares/validate");

const prisma = new PrismaClient();

const postAgreement = async (req, res) => {
    // const { title, detail, payer, payee, arbiter, amount, deadline } = req.body;
    // if (!validAddress(payer) || !validAddress(payee) || !validAddress(arbiter)) {
    //     return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid address." });
    // }
    // if (amount === 0) {
    //     return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid amount." });
    // }

}

module.exports = { postAgreement }