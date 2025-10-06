// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Escrow is ReentrancyGuard, Ownable, Pausable {
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

    event NewAgreement(
        uint256 indexed agreementId,
        address payerAddress,
        uint256 amount
    );
    event PayeeConfirmedTheAgreement(
        uint256 indexed agreementId,
        address payeeAddress
    );
    event PayerConfirmedTheAgreement(
        uint256 indexed agreementId,
        address payerAddress
    );
    event PayeeReleasesFunds(uint256 indexed agreementId, uint256 amount);

    event DisputeRaised(uint256 indexed agreementId, address raiser);

    event ArbiterReleasesFunds(uint256 indexed agreementId, uint256 amount);

    event AgreementCanceled(uint256 indexed agreementId, address by);

    event ExtendAgreementDeadline(
        uint256 indexed agreementId,
        uint256 newDeadline
    );

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
    /**
     * @title Conditional Escrow Contract
     * @author https://github.com/nadi-mah
     * @notice Allows two parties to create an agreement with a third-party arbiter and conditional fund release
     */

    /**
     * @notice Initializes the escrow contract and sets the owner
     * @param escrowOwner The address of the initial owner
     */
    constructor(address escrowOwner) Ownable(escrowOwner) {}

    function pause() public onlyOwner {
        _pause();
    }

    function inpasue() public onlyOwner {
        _unpause();
    }

    /**
     * @notice Creates a new escrow agreement between payer and payee
     * @dev Only the payer can call this function and must send ether with it. The agreement starts in Funded state.
     * @param _payee The recipient of the funds if agreement completes
     * @param _arbiter The address that resolves disputes
     * @param _deadline Unix timestamp representing the deadline
     */
    function createAgreement(
        address _payee,
        address _arbiter,
        uint256 _deadline
    ) public payable {
        if (_deadline < block.timestamp) {
            revert InvalidDeadline(
                _deadline,
                "Deadline should be time in future"
            );
        }
        if (msg.value == 0) {
            revert InvalidAmount(msg.value, "Amount must be greater than 0");
        }
        if (_payee == address(0)) {
            revert InvalidPayeeAddress(_payee, "The payee address in Invalid");
        }

        uint256 agreementId = nextAgreementId;
        Agreement memory newAgreement = Agreement(
            payable(msg.sender),
            payable(_payee),
            _arbiter,
            msg.value,
            _deadline,
            State.Funded,
            false,
            false
        );

        agreements[agreementId] = newAgreement;
        nextAgreementId++;
        emit NewAgreement(agreementId, msg.sender, msg.value);
    }
    /**
     * @notice Payee requests completion after delivering the work
     * @dev Must be called before the deadline. Only the payee can call this.
     * @param _agreementId The target agreement ID
     */

    function payeeRequestCompletion(uint256 _agreementId) public {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (currentAgreement.payeeConfirmed) {
            revert AlreadyConfirmed(
                msg.sender,
                "Payee has already confirmed completion"
            );
        }

        if (currentAgreement.payee != payable(msg.sender)) {
            revert InvalidPayeeAddress(
                msg.sender,
                "msg.sender is not the payee of the agreement"
            );
        }
        if (block.timestamp > currentAgreement.deadline) {
            revert InvalidDeadline(
                block.timestamp,
                "The agreement deadline has already expired"
            );
        }
        currentAgreement.payeeConfirmed = true;
        emit PayeeConfirmedTheAgreement(_agreementId, msg.sender);
    }
    /**
     * @notice Payer confirms the work and requests completion
     * @dev Only callable after payee has confirmed. Only the payer can call this.
     * @param _agreementId The target agreement ID
     */

    function payerRequestCompletion(uint256 _agreementId) public {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (currentAgreement.payerConfirmed) {
            revert AlreadyConfirmed(
                msg.sender,
                "Payer has already confirmed completion"
            );
        }

        if (currentAgreement.payer != payable(msg.sender)) {
            revert InvalidPayerAddress(
                msg.sender,
                "msg.sender is not the payer of the agreement"
            );
        }
        if (!currentAgreement.payeeConfirmed) {
            revert InvalidTimeForPayerToConfirm(
                msg.sender,
                "The Payee of the agreement should confirm first"
            );
        }
        currentAgreement.payerConfirmed = true;
        emit PayerConfirmedTheAgreement(_agreementId, msg.sender);
    }
    /**
     * @notice Payee releases funds after mutual confirmation
     * @dev Requires both payer and payee to have confirmed. Only payee can call. Prevents reentrancy.
     * @param _agreementId The target agreement ID
     */

    function releaseFunds(uint256 _agreementId) public nonReentrant {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (currentAgreement.payee != msg.sender) {
            revert InvalidPayeeAddress(
                msg.sender,
                "Only payee of the agreement and release funds."
            );
        }
        if (
            !currentAgreement.payerConfirmed || !currentAgreement.payeeConfirmed
        ) {
            revert ReleaseNotAllowed("Both parties must confirm");
        }
        if (currentAgreement.currentState == State.Completed) {
            revert ReleaseNotAllowed(
                "Agreement is in Completed state, funds have already released"
            );
        }
        currentAgreement.currentState = State.Completed;

        emit PayeeReleasesFunds(_agreementId, currentAgreement.amount);
        currentAgreement.payee.transfer(currentAgreement.amount);
    }
    /**
     * @notice Either party can raise a dispute after the deadline if confirmations are not aligned
     * @dev Dispute cannot be raised if both have confirmed, or neither has. Must be in Funded state.
     * @param _agreementId The target agreement ID
     */

    function raiseDispute(uint256 _agreementId) public {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (
            msg.sender != currentAgreement.payee &&
            msg.sender != currentAgreement.payer
        ) {
            revert NotParticipant(
                "msg.sender is not payer or payee of the agreement."
            );
        }
        if (currentAgreement.deadline > block.timestamp) {
            revert DisputeTooEarly(
                "Dispute can only be raised after the agreement deadline."
            );
        }
        if (
            currentAgreement.payeeConfirmed && currentAgreement.payerConfirmed
        ) {
            revert InvalidStateForDispute(
                "Cannot raise a dispute when both parties have confirmed."
            );
        }
        if (
            !currentAgreement.payeeConfirmed && !currentAgreement.payerConfirmed
        ) {
            revert InvalidStateForDispute(
                "Dispute not allowed when no confirmations have been made. Use cancelExpiredAgreement instead."
            );
        }
        if (currentAgreement.currentState != State.Funded) {
            revert InvalidStateForDispute(
                "Dispute can only be raised when agreement is in Funded state."
            );
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
    /**
     * @notice Arbiter resolves a dispute by selecting the winner
     * @dev Can only be called when agreement is in InDispute state. Winner must be either payer or payee.
     * @param _agreementId The target agreement ID
     * @param winner The selected address (payer or payee) who receives the funds
     */

    function resolveDispute(
        uint256 _agreementId,
        address winner
    ) public nonReentrant {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (msg.sender != currentAgreement.arbiter) {
            revert InvalidArbiterAddress(
                msg.sender,
                "msg.sender is not the arbiter of the agreement."
            );
        }
        if (currentAgreement.currentState != State.InDispute) {
            revert InvalidStateForResolve(
                "Dispute can only be resolved when agreement is in 'InDispute' state."
            );
        }
        if (
            winner != currentAgreement.payer && winner != currentAgreement.payee
        ) {
            revert InvalidWinnerAddress(
                winner,
                "Winner address is not payer or payee of the agreement."
            );
        }
        currentAgreement.currentState = State.Completed;
        emit ArbiterReleasesFunds(_agreementId, currentAgreement.amount);

        payable(winner).transfer(currentAgreement.amount);
    }
    /**
     * @notice Cancels an expired agreement and returns funds to payer
     * @dev  Only allowed after deadline and when no party has confirmed. Callable by anyone
     * @param _agreementId The target agreement ID
     */

    function cancelExpiredAgreement(uint256 _agreementId) public nonReentrant {
        Agreement storage currentAgreement = agreements[_agreementId];

        if (currentAgreement.currentState != State.Funded) {
            revert InvalidStateForCancel(
                "Agreement can only be cancelled when it is in Funded state."
            );
        }
        if (currentAgreement.deadline > block.timestamp) {
            revert CancelTooEarly(
                "Agreement can only be cancelled when the deadline passed."
            );
        }
        if (
            currentAgreement.payeeConfirmed || currentAgreement.payerConfirmed
        ) {
            revert AlreadyConfirmed(
                address(0),
                "Agreement can not be cancelled when parties have confirmed."
            );
        }
        currentAgreement.currentState = State.Canceled;
        emit AgreementCanceled(_agreementId, msg.sender);

        currentAgreement.payer.transfer(currentAgreement.amount);
    }
    /**
     * @notice Payer can extend the deadline before payee confirmation
     * @dev Only callable by payer, and only if agreement is in Funded state and payee has not confirmed
     * @param _agreementId The target agreement ID
     * @param _newDeadline  New future timestamp greater than current deadline
     */

    function extendDeadline(uint256 _agreementId, uint256 _newDeadline) public {
        /**
         * While blockchain contracts aim for immutability, supporting deadline extensions with mutual agreement
         *     can enhance usability in real-world scenarios. The feature should be implemented with care to avoid
         *     compromising fairness or decentralization.
         */
        Agreement storage currentAgreement = agreements[_agreementId];

        if (
            _newDeadline < currentAgreement.deadline ||
            _newDeadline < block.timestamp
        ) {
            revert InvalidDeadline(
                _newDeadline,
                "New deadline must be greater than the current deadline and a future timestamp."
            );
        }
        if (payable(msg.sender) != currentAgreement.payer) {
            revert InvalidPayerAddress(
                msg.sender,
                "msg.sender is not the payer of the agreement."
            );
        }
        if (currentAgreement.payeeConfirmed) {
            revert ExtensionNotAllowed(
                "Cannot extend deadline after payee has confirmed."
            );
        }
        if (currentAgreement.currentState != State.Funded) {
            // only needed when agreement has been canceled
            revert InvalidStateForExtension(
                "Deadline can only be extended when agreement is in funded state."
            );
        }
        currentAgreement.deadline = _newDeadline;
        emit ExtendAgreementDeadline(_agreementId, _newDeadline);
    }
    /**
     * @notice Returns details of a specific agreement
     * @param _agreementId The target agreement ID
     * @return Agreement struct including payer, payee, arbiter, amount, deadline, etc
     */

    function getAgreements(
        uint256 _agreementId
    ) external view returns (Agreement memory) {
        return (agreements[_agreementId]);
    }
    /**
     * @notice Returns the current total balance held by the escrow contract
     * @return uint256 Total balance in wei
     */

    function getEscrowBalance() external view returns (uint256) {
        return (address(this).balance);
    }
}
