// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {
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
    error InvalidStateForCancel(string message);
    error InvalidStateForExtension(string message);
    error CancelTooEarly(string message);
    error ExtensionNotAllowed(string message);

    event NewAgreement(uint256 indexed agreementId, address payerAddress, uint256 amount);
    event PayeeConfirmedTheAgreement(uint256 indexed agreementId, address payeeAddress);
    event PayerConfirmedTheAgreement(uint256 indexed agreementId, address payerAddress);
    event PayeeReleasesFunds(uint256 indexed agreementId, uint256 amount);

    event DisputeRaised(uint256 indexed agreementId, address raiser);

    event ArbiterReleasesFunds(uint256 indexed agreementId, uint256 amount);

    event AgreementCanceled(uint256 indexed agreementId, address by);

    event ExtendAgreementDeadline(uint256 indexed agreementId, uint256 newDeadline);

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
        emit PayeeConfirmedTheAgreement(_agreementId, msg.sender);
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
        emit PayerConfirmedTheAgreement(_agreementId, msg.sender);
    }

    function releaseFunds(uint256 _agreementId) public nonReentrant {
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

        emit PayeeReleasesFunds(_agreementId, currentAgreement.amount);
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
        if (!currentAgreement.payeeConfirmed && !currentAgreement.payerConfirmed) {
            revert InvalidStateForDispute(
                "Dispute not allowed when no confirmations have been made. Use cancelExpiredAgreement instead."
            );
        }
        if (currentAgreement.currentState != State.Funded) {
            revert InvalidStateForDispute("Dispute can only be raised when agreement is in Funded state.");
        }
        currentAgreement.currentState = State.InDispute;

        emit DisputeRaised(_agreementId, msg.sender);
        /**
         * Dispute:
         */
        // payee: confirmed / payer: notConfirmed => disappointed payer => arbiter act
        // payee: notConfirmed / payer: notConfirmed => payee did not do the work => transfer money to payer
        // payee: confirmed / payer: notConfirmed => payer fo not want money to transfer => arbiter act
    }

    function resolveDispute(uint256 _agreementId, address winner) public nonReentrant {
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
        emit ArbiterReleasesFunds(_agreementId, currentAgreement.amount);

        payable(winner).transfer(currentAgreement.amount);
    }

    function cancelExpiredAgreement(uint256 _agreementId) public nonReentrant {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (currentAgreement.currentState != State.Funded) {
            revert InvalidStateForCancel("Agreement can only be cancelled when it is in Funded state.");
        }
        if (currentAgreement.deadline > block.timestamp) {
            revert CancelTooEarly("Agreement can only be cancelled when the deadline passed.");
        }
        if (currentAgreement.payeeConfirmed || currentAgreement.payerConfirmed) {
            revert AlreadyConfirmed(address(0), "Agreement can not be cancelled when parties have confirmed.");
        }
        currentAgreement.currentState = State.Canceled;
        emit AgreementCanceled(_agreementId, msg.sender);

        currentAgreement.payer.transfer(currentAgreement.amount);
    }

    function extendDeadline(uint256 _agreementId, uint256 _newDeadline) public {
        /**
         * While blockchain contracts aim for immutability, supporting deadline extensions with mutual agreement
         *     can enhance usability in real-world scenarios. The feature should be implemented with care to avoid
         *     compromising fairness or decentralization.
         */
        Agreement storage currentAgreement = agreements[_agreementId];

        if (_newDeadline < currentAgreement.deadline || _newDeadline < block.timestamp) {
            revert InvalidDeadline(
                _newDeadline, "New deadline must be greater than the current deadline and a future timestamp."
            );
        }
        if (payable(msg.sender) != currentAgreement.payer) {
            revert InvalidPayerAddress(msg.sender, "msg.sender is not the payer of the agreement.");
        }
        if (currentAgreement.payeeConfirmed) {
            revert ExtensionNotAllowed("Cannot extend deadline after payee has confirmed.");
        }
        if (currentAgreement.currentState != State.Funded) {
            // only needed when agreement has been canceled
            revert InvalidStateForExtension("Deadline can only be extended when agreement is in funded state.");
        }
        currentAgreement.deadline = _newDeadline;
        emit ExtendAgreementDeadline(_agreementId, _newDeadline);
    }

    function getAgreements(uint256 _agreementId) external view returns (Agreement memory) {
        return (agreements[_agreementId]);
    }

    function getEscrowBalance() external view returns (uint256) {
        return (address(this).balance);
    }
}
