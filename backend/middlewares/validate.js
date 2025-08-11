const validAddress = (address) => {
    if (address === "0x0" || !address) {
        return false;
    }
    return /^0x[a-fA-F0-9]{3}$/.test(address);
}

module.exports = { validAddress }