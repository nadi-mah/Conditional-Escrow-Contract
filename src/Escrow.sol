// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Escrow {

    error InvalidDeadline(uint256 time, string message);
    error InvalidAmount(uint256 amount, string message);
    error InvalidPayeeAddress(address payee, string message);

    event NewAgreement(uint indexed agreementId, address payerAddress, uint256 amount);

    uint public nextAgreementId = 0;
    mapping(uint => Agreement) public agreements;

    enum State {
        Funded,
        Completed,
        Canceled,
        InDispute
    };

    struct Agreement {
        address payable payer;
        address payable payee;
        address arbiter;
        uint256 amount;
        uint256 deadline;
        State currentState;
        bool payerConfirmed;
        bool payeeConfirmed;
    };

    function createAgreement(address _payee, address _arbiter, uint256 _deadline) public payable{

        if (_deadline < block.timestamp){
            revert InvalidDeadline(_deadline, "Deadline should be time in future");
        }
        if(msg.value <= 0){
            revert InvalidAmount(msg.value, "The entered amount value in too low");
        }
        if(_payee == address(0)){
            revert InvalidPayeeAddress(_payee, "The payee address in Invalid");
        }

        uint agreementId = nextAgreementId + 1;
        Agreement memory newAgreement = Agreement(msg.sender, _payee, _arbiter, msg.value, _deadline, State.Funded, false, false);
        
        agreements[agreementId] = newAgreement;
        nextAggrementId++;
        emit NewAgreement(agreementId, msg.sender, msg.value);
    }
}
