const validAddress = (address, role) => {
    const zeroAddress = "0x0";
    const isValid = /^0x[a-fA-F0-9]{3}$/.test(address) && address !== zeroAddress;

    return {
        status: isValid,
        message: isValid ? "" : `Invalid ${role} address.`
    };
}
const validAmount = (amount) => {
    const minAmount = 0;
    const isValid = amount > minAmount;

    return {
        status: isValid,
        message: isValid ? "" : `Invalid amount, entered amount should be higher that ${minAmount} eth.`
    }
}

const validDeadline = (date) => {

}

module.exports = { validAddress, validAmount, validDeadline }


