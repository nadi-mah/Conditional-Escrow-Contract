// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Escrow} from "../src/Escrow.sol";

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

    function createTestAgreement(address _payer, address _payee, address _arbiter, uint256 _amount, uint256 _deadline)
        internal
        returns (uint256)
    {
        vm.prank(_payer);
        vm.deal(_payer, 1 ether);
        escrow.createAgreement{value: _amount}(_payee, _arbiter, _deadline);
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

        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp + 1 days);
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidPayeeAddress.selector, fakePayee, "msg.sender is not the payee of the agreement"
            )
        );
        vm.prank(fakePayee);
        escrow.payeeRequestCompletion(agreementId);
    }

    function test_RevertWhen_PayeeRequestCompletionLate() public {
        createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);
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

        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);

        vm.prank(payee);
        vm.warp(1_000_000);
        escrow.payeeRequestCompletion(agreementId);

        assertEq(escrow.getAgreements(agreementId).payeeConfirmed, true);
    }

    function test_payeeRequestCompletion_eventHappened() public {
        vm.warp(2_000_000);
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);
        vm.expectEmit(true, true, false, true);
        emit Escrow.payeeConfirmedTheAgreement(agreementId, payee);
        vm.prank(payee);
        escrow.payeeRequestCompletion(agreementId);
    }

    function test_revertWhen_payeeRequestTwice() public {
        vm.warp(2_000_000);
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);

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

        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);

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
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);

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
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);

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
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);

        vm.prank(payee);
        vm.warp(1_000_000);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        vm.expectEmit(true, true, false, true);
        emit Escrow.payerConfirmedTheAgreement(agreementId, payer);

        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);
    }

    function test_payerRequestCompletion_handlePayerConfirmed() public {
        vm.warp(2_000_000);

        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp);

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
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, 2_000_000);
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
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, 2_000_000);
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
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, 2_000_000);
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
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp + 1 days);
        confirmByBoth(agreementId);

        vm.prank(payee);
        escrow.releaseFunds(agreementId);
        assertEq(uint8(escrow.getAgreements(agreementId).currentState), uint8(Escrow.State.Completed));
    }

    function test_ReleaseFunds_transferFunds() public {
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp + 1 days);

        confirmByBoth(agreementId);

        vm.prank(payee);
        escrow.releaseFunds(agreementId);
        assertEq(payee.balance, 0.1 ether);
        assertEq(address(escrow).balance, 0);
    }

    function test_ReleaseFunds_eventHappened() public {
        uint256 agreementId = createTestAgreement(payer, payee, arbiter, 0.1 ether, block.timestamp + 1 days);

        confirmByBoth(agreementId);

        vm.expectEmit(true, true, false, true);
        emit Escrow.payeeReleasesFunds(agreementId, escrow.getAgreements(agreementId).amount);
        vm.prank(payee);
        escrow.releaseFunds(agreementId);
    }
}
