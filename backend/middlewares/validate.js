const validAddress = (address, role) => {
    if (address === "0x0" || !address || !/^0x[a-fA-F0-9]{3}$/.test(address)) {
        return { status: false, message: `Invalid ${role} address.` };

    } else {
        return { status: true, message: "" };
    }
}

module.exports = { validAddress }