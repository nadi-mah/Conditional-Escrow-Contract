import { ethers } from "ethers";
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

export async function createAgreement(payee, arbiter, deadline) {
    const payeeAddress = getAddress(payee);
    const arbiterAddress = getAddress(arbiter);

    const contract = getEscrowContract("payer");

    const amountToSend = parseUnits("0.1"); // 0.1 ETH in wei
    console.log(amountToSend);
    const options = { value: amountToSend };

    const tx = await contract.createAgreement(payeeAddress, arbiterAddress, deadline, options);
    return tx.wait();
}
export async function getAgreement(agreementId) {
    const contract = getEscrowContract("payer");
    const tx = await contract.getAgreements(agreementId);
    return tx;
}
export async function getBalance() {
    const contract = getEscrowContract("payer");
    const tx = await contract.getEscrowBalance();
    return tx;
}

export async function readNextAgreementId() {
    const contract = getEscrowContract("payer");
    const id = await contract.nextAgreementId();
    console.log("Next Agreement ID:", id.toString());
    return id;
}