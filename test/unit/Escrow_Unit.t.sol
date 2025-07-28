// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Escrow} from "../../src/Escrow.sol";

contract EscrowTest is Test {
    Escrow public escrow;

    address public payer;
    address public payee;
    address public arbiter;

    function setUp() public {
        escrow = new Escrow();

        arbiter = makeAddr("arbiter");
        payee = makeAddr("payee");
        payer = makeAddr("payer");
    }

    function createTestAgreement(uint256 _deadline) internal returns (uint256) {
        vm.prank(payer);
        vm.deal(payer, 1 ether);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, _deadline);
        vm.stopPrank();
        return escrow.nextAgreementId() - 1;
    }

    function confirmByBoth(uint256 _agreementId) internal {
        vm.prank(payee);
        escrow.payeeRequestCompletion(_agreementId);
        vm.stopPrank();

        vm.prank(payer);
        escrow.payerRequestCompletion(_agreementId);
        vm.stopPrank();
    }

    function confirmByPayee(uint256 _agreementId) internal {
        vm.prank(payee);
        escrow.payeeRequestCompletion(_agreementId);
        vm.stopPrank();
    }

    function confrimByPayer(uint256 _agreementId) internal {
        vm.prank(payer);
        escrow.payerRequestCompletion(_agreementId);
        vm.stopPrank();
    }

    // Group: createAgreement
    function test_RevertWhen_deadlineIsOutDated() public {
        uint256 fake_time = 1_000_000;
        vm.warp(fake_time);

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidDeadline.selector, block.timestamp - 1 days, "Deadline should be time in future"
            )
        );
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, block.timestamp - 1 days);
    }

    function test_RevertWhen_AmountIsZero() public {
        vm.expectRevert(abi.encodeWithSelector(Escrow.InvalidAmount.selector, 0, "Amount must be greater than 0"));

        vm.prank(payer);
        escrow.createAgreement{value: 0}(payee, arbiter, block.timestamp + 1 days);
    }

    function test_RevertWhen_PayeeAddressIsInvalid() public {
        vm.expectRevert(
            abi.encodeWithSelector(Escrow.InvalidPayeeAddress.selector, address(0), "The payee address in Invalid")
        );

        payee = address(0);
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, block.timestamp + 1 days);
    }

    function test_createAgreement_handleNextAgreementId() public {
        address payer1 = makeAddr("payer1");
        address payer2 = makeAddr("payer2");

        vm.deal(payer1, 1 ether);
        vm.deal(payer2, 1 ether);

        vm.prank(payer1);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, block.timestamp + 1 days);
        vm.stopPrank();
        assertEq(escrow.nextAgreementId(), uint256(1));
        vm.prank(payer2);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, block.timestamp + 1 days);
        vm.stopPrank();
        assertEq(escrow.nextAgreementId(), uint256(2));
    }

    function test_createAgreement_handleStorePayers() public {
        address payer1 = makeAddr("payer1");
        address payer2 = makeAddr("payer2");

        vm.deal(payer1, 1 ether);
        vm.deal(payer2, 1 ether);

        vm.prank(payer1);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, block.timestamp + 1 days);
        vm.stopPrank();
        vm.prank(payer2);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, block.timestamp + 1 days);
        vm.stopPrank();

        assertEq(escrow.getAgreements(uint256(0)).payer, payer1);
        assertEq(escrow.getAgreements(uint256(1)).payer, payer2);
    }

    function test_createAgreement_eventHappened() public {
        uint256 nextAgreementId = escrow.nextAgreementId();
        uint256 expectedAmount = 0.1 ether;

        vm.expectEmit(true, false, false, true);
        emit Escrow.NewAgreement(nextAgreementId, payer, expectedAmount);

        vm.deal(payer, 1 ether);
        vm.prank(payer);

        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, block.timestamp + 1 days);
    }

    function test_createAgreement_escrowBalanceChanges() public {
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, block.timestamp + 1 days);

        uint256 currentBalance = escrow.getEscrowBalance();
        assertEq(currentBalance, 0.1 ether);
    }

    // Group: payeeRequestCompletion
    function test_RevertWhen_payeeDidNotRequestCompletion() public {
        address fakePayee = makeAddr("fakePayee");

        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidPayeeAddress.selector, fakePayee, "msg.sender is not the payee of the agreement"
            )
        );
        vm.prank(fakePayee);
        escrow.payeeRequestCompletion(agreementId);
    }

    function test_RevertWhen_PayeeRequestCompletionLate() public {
        createTestAgreement(block.timestamp);
        vm.warp(2_000_000);
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidDeadline.selector, block.timestamp, "The agreement deadline has already expired"
            )
        );
        vm.prank(payee);
        escrow.payeeRequestCompletion(0);
    }

    function test_payeeRequestCompletion_handlePayeeConfirmed() public {
        vm.warp(2_000_000);

        uint256 agreementId = createTestAgreement(block.timestamp);

        vm.prank(payee);
        vm.warp(1_000_000);
        escrow.payeeRequestCompletion(agreementId);

        assertEq(escrow.getAgreements(agreementId).payeeConfirmed, true);
    }

    function test_payeeRequestCompletion_eventHappened() public {
        vm.warp(2_000_000);
        uint256 agreementId = createTestAgreement(block.timestamp);
        vm.expectEmit(true, true, false, true);
        emit Escrow.PayeeConfirmedTheAgreement(agreementId, payee);
        vm.prank(payee);
        escrow.payeeRequestCompletion(agreementId);
    }

    function test_revertWhen_payeeRequestTwice() public {
        vm.warp(2_000_000);
        uint256 agreementId = createTestAgreement(block.timestamp);

        vm.prank(payee);
        vm.warp(1_000_000);

        escrow.payeeRequestCompletion(agreementId);

        vm.expectRevert(
            abi.encodeWithSelector(Escrow.AlreadyConfirmed.selector, payee, "Payee has already confirmed completion")
        );
        vm.prank(payee);
        escrow.payeeRequestCompletion(agreementId);
    }

    // Group: payerRequestCompletion
    function test_RevertWhen_payerDidNotRequestCompletion() public {
        vm.warp(2_000_000);

        uint256 agreementId = createTestAgreement(block.timestamp);

        vm.prank(payee);
        vm.warp(1_000_000);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        address fakePayer = makeAddr("fakePayer");

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidPayerAddress.selector, fakePayer, "msg.sender is not the payer of the agreement"
            )
        );
        vm.prank(fakePayer);
        escrow.payerRequestCompletion(agreementId);
    }

    function test_RevertWhen_payerRequestConfirmBeforePayee() public {
        vm.warp(2_000_000);
        uint256 agreementId = createTestAgreement(block.timestamp);

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidTimeForPayerToConfirm.selector, payer, "The Payee of the agreement should confirm first"
            )
        );
        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);
    }

    function test_revertWhen_payerRequestTwice() public {
        vm.warp(2_000_000);
        uint256 agreementId = createTestAgreement(block.timestamp);

        vm.prank(payee);
        vm.warp(1_000_000);

        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);

        vm.expectRevert(
            abi.encodeWithSelector(Escrow.AlreadyConfirmed.selector, payer, "Payer has already confirmed completion")
        );
        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);
    }

    function test_payerRequestCompletion_eventHappened() public {
        vm.warp(2_000_000);
        uint256 agreementId = createTestAgreement(block.timestamp);

        vm.prank(payee);
        vm.warp(1_000_000);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        vm.expectEmit(true, true, false, true);
        emit Escrow.PayerConfirmedTheAgreement(agreementId, payer);

        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);
    }

    function test_payerRequestCompletion_handlePayerConfirmed() public {
        vm.warp(2_000_000);

        uint256 agreementId = createTestAgreement(block.timestamp);

        vm.prank(payee);
        vm.warp(1_000_000);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);

        assertEq(escrow.getAgreements(agreementId).payerConfirmed, true);
    }

    // Group: releaseFunds
    function test_RevertWhen_NotPayeeCallsReleaseFunds() public {
        uint256 agreementId = createTestAgreement(2_000_000);
        // vm.prank(payee);
        // vm.warp(1_000_000);
        // escrow.payeeRequestCompletion(agreementId);
        // vm.stopPrank();

        // vm.prank(payer);
        // escrow.payerRequestCompletion(agreementId);
        // vm.stopPrank();

        address fakePayee = makeAddr("fakePayee");
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidPayeeAddress.selector, fakePayee, "Only payee of the agreement and release funds."
            )
        );
        vm.prank(fakePayee);
        escrow.releaseFunds(agreementId);
    }

    function test_RevertWhen_releaseFundsCallsBeforePayerConfirms() public {
        uint256 agreementId = createTestAgreement(2_000_000);
        vm.prank(payee);
        vm.warp(1_000_000);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        // vm.prank(payer);
        // escrow.payerRequestCompletion(agreementId);
        // vm.stopPrank();

        vm.expectRevert(abi.encodeWithSelector(Escrow.ReleaseNotAllowed.selector, "Both parties must confirm"));
        vm.prank(payee);
        escrow.releaseFunds(agreementId);
    }

    function test_RevertWhen_agreementStateIsAlreadyCompleted() public {
        uint256 agreementId = createTestAgreement(2_000_000);
        vm.prank(payee);
        vm.warp(1_000_000);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);
        vm.stopPrank();

        vm.prank(payee);
        escrow.releaseFunds(agreementId);

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.ReleaseNotAllowed.selector, "Agreement is in Completed state, funds have already released"
            )
        );
        vm.prank(payee);
        escrow.releaseFunds(agreementId);
    }

    function test_ReleaseFunds_StateChangesToCompleted() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);
        confirmByBoth(agreementId);

        vm.prank(payee);
        escrow.releaseFunds(agreementId);
        assertEq(uint8(escrow.getAgreements(agreementId).currentState), uint8(Escrow.State.Completed));
    }

    function test_ReleaseFunds_transferFunds() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        confirmByBoth(agreementId);

        vm.prank(payee);
        escrow.releaseFunds(agreementId);
        assertEq(payee.balance, 0.1 ether);
        assertEq(address(escrow).balance, 0);
    }

    function test_ReleaseFunds_eventHappened() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        confirmByBoth(agreementId);

        vm.expectEmit(true, true, false, true);
        emit Escrow.PayeeReleasesFunds(agreementId, escrow.getAgreements(agreementId).amount);
        vm.prank(payee);
        escrow.releaseFunds(agreementId);
    }

    // Group: raiseDispute
    function test_RevertWhen_payeeOrPayerDidNotRaiseDispute() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        confirmByBoth(agreementId);

        address fakeCaller = makeAddr("fakeCaller");
        vm.expectRevert(
            abi.encodeWithSelector(Escrow.NotParticipant.selector, "msg.sender is not payer or payee of the agreement.")
        );
        vm.prank(fakeCaller);
        escrow.raiseDispute(agreementId);
    }

    function test_RevertWhen_disputeRaisedTooEarly() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        confirmByBoth(agreementId);
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.DisputeTooEarly.selector, "Dispute can only be raised after the agreement deadline."
            )
        );
        vm.prank(payer);
        escrow.raiseDispute(agreementId);
    }

    function test_RevertWhen_bothPayeeAndPayerHaveConfirmed() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);
        confirmByBoth(agreementId);

        vm.warp(block.timestamp + 2 days);
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidStateForDispute.selector, "Cannot raise a dispute when both parties have confirmed."
            )
        );
        vm.prank(payer);
        escrow.raiseDispute(agreementId);
    }

    function test_RevertWhen_bothPayeeAndPayerHaveNotConfirmed() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);
        // confirmByBoth(agreementId);

        vm.warp(block.timestamp + 2 days);
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidStateForDispute.selector,
                "Dispute not allowed when no confirmations have been made. Use cancelExpiredAgreement instead."
            )
        );
        vm.prank(payer);
        escrow.raiseDispute(agreementId);
    }

    function test_RevertWhen_disputeRaisedInWrongState() public {
        // uint256 agreementId = createTestAgreement(
        //     block.timestamp + 1 days
        // );
        // confirmByBoth(agreementId);
        // vm.prank(payee);
        // escrow.releaseFunds(agreementId);
        // vm.warp(block.timestamp + 2 days);
        // vm.prank(payee);
        // escrow.raiseDispute(agreementId);
        // vm.expectRevert(
        //     abi.encodeWithSelector(
        //         Escrow.InvalidStateForDispute.selector,
        //         "Dispute can only be raised when agreement is in Funded state."
        //     )
        // );
        // vm.prank(payer);
        // escrow.raiseDispute(agreementId);
    }

    function test_raiseDispute_eventHappened() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp);
        confirmByPayee(agreementId);

        vm.warp(block.timestamp + 2 days);

        vm.expectEmit(true, true, false, true);
        emit Escrow.DisputeRaised(agreementId, payer);

        vm.prank(payer);
        escrow.raiseDispute(agreementId);
    }

    function test_raiseDispute_stateChangesToInDispute() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp);
        confirmByPayee(agreementId);

        vm.warp(block.timestamp + 2 days);

        vm.prank(payer);
        escrow.raiseDispute(agreementId);

        assertEq(uint8(escrow.getAgreements(agreementId).currentState), uint8(Escrow.State.InDispute));
    }

    // Group: resolveDispute
    function test_RevertWhen_arbiterDidNotResolveDispute() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp);
        confirmByPayee(agreementId);

        vm.warp(block.timestamp + 2 days);
        vm.prank(payer);
        escrow.raiseDispute(agreementId);

        address fakeArbiter = makeAddr("fakeArbiter");
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidArbiterAddress.selector, fakeArbiter, "msg.sender is not the arbiter of the agreement."
            )
        );

        vm.prank(fakeArbiter);
        escrow.resolveDispute(agreementId, payer);
    }

    function test_RevertWhen_agreementIsInFundedState() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);
        // confirmByBoth(agreementId);

        // vm.warp(block.timestamp + 2 days);

        // vm.prank(payer);
        // escrow.raiseDispute(agreementId);

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidStateForResolve.selector,
                "Dispute can only be resolved when agreement is in 'InDispute' state."
            )
        );

        vm.prank(arbiter);
        escrow.resolveDispute(agreementId, payer);
    }

    function test_RevertWhen_agreementIsInCompletedState() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);
        confirmByBoth(agreementId);

        vm.warp(block.timestamp + 2 days);
        vm.prank(payee);
        escrow.releaseFunds(agreementId);

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidStateForResolve.selector,
                "Dispute can only be resolved when agreement is in 'InDispute' state."
            )
        );

        vm.prank(arbiter);
        escrow.resolveDispute(agreementId, payer);
    }

    function test_RevertWhen_winnerIsNeitherPayeeOrPayee() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp);
        confirmByPayee(agreementId);

        vm.warp(block.timestamp + 2 days);
        vm.prank(payer);
        escrow.raiseDispute(agreementId);

        address fakeWinner = makeAddr("fakeWinner");
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidWinnerAddress.selector,
                fakeWinner,
                "Winner address is not payer or payee of the agreement."
            )
        );
        vm.prank(arbiter);
        escrow.resolveDispute(agreementId, fakeWinner);
    }

    function test_resolveDispute_stateChangesToCompleted() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp);
        confirmByPayee(agreementId);

        vm.warp(block.timestamp + 2 days);

        vm.prank(payer);
        escrow.raiseDispute(agreementId);

        vm.prank(arbiter);
        escrow.resolveDispute(agreementId, payee);

        assertEq(uint8(escrow.getAgreements(agreementId).currentState), uint8(Escrow.State.Completed));
    }

    function test_resolveDispute_eventHappened() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp);
        confirmByPayee(agreementId);

        vm.warp(block.timestamp + 2 days);

        vm.prank(payer);
        escrow.raiseDispute(agreementId);

        vm.expectEmit(true, true, false, true);
        emit Escrow.ArbiterReleasesFunds(agreementId, 0.1 ether);

        vm.prank(arbiter);
        escrow.resolveDispute(agreementId, payee);
    }

    function test_resolveDispute_transferFunds() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp);
        confirmByPayee(agreementId);

        vm.warp(block.timestamp + 2 days);

        vm.prank(payer);
        escrow.raiseDispute(agreementId);

        vm.prank(arbiter);
        escrow.resolveDispute(agreementId, payee);

        assertEq(payee.balance, 0.1 ether);
        assertEq(address(escrow).balance, 0);
    }

    // Group: cancelExpiredAgreement
    function test_RevertWhen_cancellationInWrongState() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        confirmByBoth(agreementId);

        vm.warp(block.timestamp + 2 days);
        vm.prank(payee);
        escrow.releaseFunds(agreementId);

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidStateForCancel.selector, "Agreement can only be cancelled when it is in Funded state."
            )
        );

        address randomCaller = makeAddr("randomCaller");
        vm.prank(randomCaller);

        escrow.cancelExpiredAgreement(agreementId);
    }

    function test_RevertWhen_deadlineIsnotPass() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);
        vm.warp(block.timestamp);
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.CancelTooEarly.selector, "Agreement can only be cancelled when the deadline passed."
            )
        );
        address randomCaller = makeAddr("randomCaller");
        vm.prank(randomCaller);

        escrow.cancelExpiredAgreement(agreementId);
    }

    function test_RevertWhen_onePartiesHaveConfirmed() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        // confirmByBoth(agreementId);
        confirmByPayee(agreementId);

        vm.warp(block.timestamp + 2 days);
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.AlreadyConfirmed.selector,
                address(0),
                "Agreement can not be cancelled when parties have confirmed."
            )
        );

        address randomCaller = makeAddr("randomCaller");
        vm.prank(randomCaller);

        escrow.cancelExpiredAgreement(agreementId);
    }

    function test_cancelExpiredAgreement_stateChangesToCanceled() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp + 2 days);

        address randomCaller = makeAddr("randomCaller");
        vm.prank(randomCaller);

        escrow.cancelExpiredAgreement(agreementId);

        assertEq(uint8(escrow.getAgreements(agreementId).currentState), uint8(Escrow.State.Canceled));
    }

    function test_cancelExpiredAgreement_eventHappened() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);

        vm.warp(block.timestamp + 2 days);
        address randomCaller = makeAddr("randomCaller");

        vm.expectEmit(true, true, false, true);
        emit Escrow.AgreementCanceled(agreementId, randomCaller);
        vm.prank(randomCaller);

        escrow.cancelExpiredAgreement(agreementId);
    }

    function test_cancelExpiredAgreement_transferFunds() public {
        uint256 agreementId = createTestAgreement(block.timestamp + 1 days);
        assertEq(payer.balance, 0.9 ether);

        vm.warp(block.timestamp + 2 days);

        address randomCaller = makeAddr("randomCaller");
        vm.prank(randomCaller);

        escrow.cancelExpiredAgreement(agreementId);

        assertEq(payer.balance, 1 ether);
    }
}
