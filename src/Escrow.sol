// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Escrow {
    error InvalidDeadline(uint256 time, string message);
    error InvalidAmount(uint256 amount, string message);
    error InvalidPayeeAddress(address payee, string message);
    error InvalidPayerAddress(address payer, string message);
    error InvalidArbiterAddress(address arbiter, string message);
    error InvalidWinnerAddress(address winner, string message);
    error AlreadyConfirmed(address from, string message);
    error InvalidTimeForPayerToConfirm(address payer, string message);
    error ReleaseNotAllowed(string message);
    error NotParticipant(string message);
    error DisputeTooEarly(string message);
    error InvalidStateForDispute(string message);
    error InvalidStateForResolve(string message);

    event NewAgreement(uint256 indexed agreementId, address payerAddress, uint256 amount);
    event payeeConfirmedTheAgreement(uint256 indexed agreementId, address payeeAddress);
    event payerConfirmedTheAgreement(uint256 indexed agreementId, address payerAddress);
    event payeeReleasesFunds(uint256 indexed agreementId, uint256 amount);

    event disputeRaised(uint256 indexed agreementId, address raiser);

    event arbiterReleasesFunds(uint256 indexed agreementId, uint256 amount);

    uint256 public nextAgreementId = 0;

    mapping(uint256 => Agreement) public agreements;

    enum State {
        Funded,
        Completed,
        Canceled,
        InDispute
    }

    struct Agreement {
        address payable payer;
        address payable payee;
        address arbiter;
        uint256 amount;
        uint256 deadline;
        State currentState;
        bool payerConfirmed;
        bool payeeConfirmed;
    }

    function createAgreement(address _payee, address _arbiter, uint256 _deadline) public payable {
        if (_deadline < block.timestamp) {
            revert InvalidDeadline(_deadline, "Deadline should be time in future");
        }
        if (msg.value == 0) {
            revert InvalidAmount(msg.value, "Amount must be greater than 0");
        }
        if (_payee == address(0)) {
            revert InvalidPayeeAddress(_payee, "The payee address in Invalid");
        }

        uint256 agreementId = nextAgreementId;
        Agreement memory newAgreement =
            Agreement(payable(msg.sender), payable(_payee), _arbiter, msg.value, _deadline, State.Funded, false, false);

        agreements[agreementId] = newAgreement;
        nextAgreementId++;
        emit NewAgreement(agreementId, msg.sender, msg.value);
    }

    function payeeRequestCompletion(uint256 _agreementId) public {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (currentAgreement.payeeConfirmed) {
            revert AlreadyConfirmed(msg.sender, "Payee has already confirmed completion");
        }

        if (currentAgreement.payee != payable(msg.sender)) {
            revert InvalidPayeeAddress(msg.sender, "msg.sender is not the payee of the agreement");
        }
        if (block.timestamp > currentAgreement.deadline) {
            revert InvalidDeadline(block.timestamp, "The agreement deadline has already expired");
        }
        currentAgreement.payeeConfirmed = true;
        emit payeeConfirmedTheAgreement(_agreementId, msg.sender);
    }

    function payerRequestCompletion(uint256 _agreementId) public {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (currentAgreement.payerConfirmed) {
            revert AlreadyConfirmed(msg.sender, "Payer has already confirmed completion");
        }

        if (currentAgreement.payer != payable(msg.sender)) {
            revert InvalidPayerAddress(msg.sender, "msg.sender is not the payer of the agreement");
        }
        if (!currentAgreement.payeeConfirmed) {
            revert InvalidTimeForPayerToConfirm(msg.sender, "The Payee of the agreement should confirm first");
        }
        currentAgreement.payerConfirmed = true;
        emit payerConfirmedTheAgreement(_agreementId, msg.sender);
    }

    function releaseFunds(uint256 _agreementId) public {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (currentAgreement.payee != msg.sender) {
            revert InvalidPayeeAddress(msg.sender, "Only payee of the agreement and release funds.");
        }
        if (!currentAgreement.payerConfirmed || !currentAgreement.payeeConfirmed) {
            revert ReleaseNotAllowed("Both parties must confirm");
        }
        if (currentAgreement.currentState == State.Completed) {
            revert ReleaseNotAllowed("Agreement is in Completed state, funds have already released");
        }
        currentAgreement.currentState = State.Completed;

        emit payeeReleasesFunds(_agreementId, currentAgreement.amount);
        currentAgreement.payee.transfer(currentAgreement.amount);
    }

    function raiseDispute(uint256 _agreementId) public {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (msg.sender != currentAgreement.payee && msg.sender != currentAgreement.payer) {
            revert NotParticipant("msg.sender is not payer or payee of the agreement.");
        }
        if (currentAgreement.deadline > block.timestamp) {
            revert DisputeTooEarly("Dispute can only be raised after the agreement deadline.");
        }
        if (currentAgreement.payeeConfirmed && currentAgreement.payerConfirmed) {
            revert InvalidStateForDispute("Cannot raise a dispute when both parties have confirmed.");
        }
        if (currentAgreement.currentState != State.Funded) {
            revert InvalidStateForDispute("Dispute can only be raised when agreement is in Funded state.");
        }
        currentAgreement.currentState = State.InDispute;

        emit disputeRaised(_agreementId, msg.sender);
        /**
         * Dispute:
         */
        // payee: confirmed / payer: notConfirmed => disappointed payer => arbiter act
        // payee: notConfirmed / payer: notConfirmed => payee did not do the work => transfer money to payer
        // payee: confirmed / payer: notConfirmed => payer fo not want money to transfer => arbiter act
    }

    function resolveDispute(uint256 _agreementId, address winner) public {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (msg.sender != currentAgreement.arbiter) {
            revert InvalidArbiterAddress(msg.sender, "msg.sender is not the arbiter of the agreement.");
        }
        if (currentAgreement.currentState != State.InDispute) {
            revert InvalidStateForResolve("Dispute can only be resolved when agreement is in 'InDispute' state.");
        }
        if (winner != currentAgreement.payer && winner != currentAgreement.payee) {
            revert InvalidWinnerAddress(winner, "Winner address is not payer or payee of the agreement.");
        }
        currentAgreement.currentState = State.Completed;
        emit arbiterReleasesFunds(_agreementId, currentAgreement.amount);

        payable(winner).transfer(currentAgreement.amount);
    }

    function getAgreements(uint256 _agreementId) external view returns (Agreement memory) {
        return (agreements[_agreementId]);
    }

    function getEscrowBalance() external view returns (uint256) {
        return (address(this).balance);
    }
}
