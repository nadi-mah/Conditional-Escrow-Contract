// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Escrow} from "../src/Escrow.sol";

contract EscrowScript is Script {
    address owner = vm.envAddress("OWNER");

    function run() external {
        vm.startBroadcast();
        new Escrow(owner);
        vm.stopBroadcast();
    }
}
