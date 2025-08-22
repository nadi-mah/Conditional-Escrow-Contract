import { ethers } from "ethers";
import { Interface } from "ethers";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { getAddress, parseUnits } from "ethers";
import EscrowAbi from "../../../out/Escrow.sol/Escrow.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const keys = {
    payer: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    payee: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    arbiter: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
};
export async function getEscrowContractFromMetaMask() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, EscrowAbi.abi, signer);
}

export function getEscrowContract(role) {
    const provider = new JsonRpcProvider("http://127.0.0.1:8545");
    const privateKey = keys[role];
    if (!privateKey) throw new Error("Invalid role");
    const wallet = new Wallet(privateKey, provider);
    return new Contract(contractAddress, EscrowAbi.abi, wallet);
}
/** Create Agreement*/
export async function createAgreement(payee, arbiter, deadline, ethAmount) {

    const payeeAddress = getAddress(payee);
    const arbiterAddress = getAddress(arbiter);

    const contract = getEscrowContract("payer");

    const amountToSend = parseUnits(ethAmount); // in wei
    console.log(amountToSend);
    const options = { value: amountToSend };

    try {
        const tx = await contract.createAgreement(payeeAddress, arbiterAddress, deadline, options);
        return tx.wait();
    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }

}

/** Get agreement onchain ID for database */
export async function readNextAgreementId() {
    const contract = getEscrowContract("payer");
    const id = await contract.nextAgreementId();
    console.log("Next Agreement ID:", id.toString());
    return id;

}

/** Get details of an agreement */
export async function getAgreement(id) {
    const contract = getEscrowContract("payer");
    try {
        const tx = await contract.getAgreements(id);
        return tx;
    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }

}
export async function extendDuration(id, newDuration) {
    const contract = getEscrowContract("payer");
    try {
        const tx = await contract.extendDeadline(parseInt(id), newDuration);
        return tx.wait();

    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }
}
export async function confirmByPayee(id) {
    const contract = getEscrowContract("payee");
    try {
        const tx = await contract.payeeRequestCompletion(parseInt(id),);
        return tx.wait();

    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }
}
export async function confirmByPayer(id) {
    const contract = getEscrowContract("payer");
    try {
        const tx = await contract.payerRequestCompletion(parseInt(id),);
        return tx.wait();

    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }
}
export async function cancelExpiredAgreement(id) {
    const contract = getEscrowContract("payer");
    try {
        const tx = await contract.cancelExpiredAgreement(parseInt(id));
        return tx.wait();

    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }
}
export async function raiseDispute(id, role) {
    const contract = getEscrowContract(role);
    try {
        const tx = await contract.raiseDispute(parseInt(id));
        return tx.wait();

    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }
}
export async function releaseFunds(id) {
    const contract = getEscrowContract("payee");
    try {
        const balanceBefore = await getBalance();
        console.log("Escrow Balance Before: ", balanceBefore);
        const tx = await contract.releaseFunds(parseInt(id),);
        const balanceAfter = await getBalance();
        console.log("Escrow Balance after: ", balanceAfter);
        return tx.wait();

    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }
}
export async function resolveDispute(id, winner) {
    const contract = getEscrowContract("arbiter");

    try {
        const balanceBefore = await getBalance();
        console.log("Escrow Balance Before: ", balanceBefore);
        await getPartiesBalance();
        const tx = await contract.resolveDispute(parseInt(id), winner);

        const balanceAfter = await getBalance();
        console.log("Escrow Balance after: ", balanceAfter);
        await getPartiesBalance()
        return tx.wait();

    } catch (err) {
        if (err.data) {
            handleCustomError(err)
        } else {
            console.error(err);
        }
        throw err;
    }
}
function handleCustomError(err) {
    const iface = new Interface(EscrowAbi.abi);
    try {
        const decoded = iface.parseError(err.data);
        console.error("Custom error:", decoded.name, decoded.args);
    } catch {
        console.error("Raw revert data:", err.data);
    }
}
async function getPartiesBalance() {
    const provider = new JsonRpcProvider("http://127.0.0.1:8545");
    const payerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const payeeAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

    const payerBalance = await provider.getBalance(payerAddress);
    console.log("Payer's Balance: ", payerBalance);

    const payeeBalance = await provider.getBalance(payeeAddress);
    console.log("Payee's Balance: ", payeeBalance);

}
export async function getBalance() {
    const contract = getEscrowContract("payer");
    const tx = await contract.getEscrowBalance();
    return tx;
}

