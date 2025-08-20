import { ethers } from "ethers";
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
    return new ethers.Contract(contractAddress, EscrowAbi, signer);
}

export function getEscrowContract(role) {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    const privateKey = keys[role];
    if (!privateKey) throw new Error("Invalid role");
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(contractAddress, EscrowAbi, wallet);
}

export async function createAgreement(payee, arbiter, deadline) {
    const contract = getEscrowContract("payer");
    const tx = await contract.createAgreement(payee, arbiter, deadline);
    return tx.wait();

}