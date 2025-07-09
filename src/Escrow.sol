// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Escrow {
    enum State {
        Created,
        Funded,
        Completed,
        Cnaceled,
        InDispute
    }

    struct Aggrement {
        address payable payer;
        address payable payee;
        address arbiter;
        uint256 amount;
        uint256 deadline;
        State currentState;
        bool payerConfirmed;
        bool payeeConfirmed;
    }
}
