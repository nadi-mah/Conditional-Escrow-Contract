// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Escrow} from "../../src/Escrow.sol";

contract EscrowIntegrationTest is Test {
    Escrow public escrow;

    address public payer;
    address public payee;
    address public arbiter;
    address public owner;

    function setUp() public {
        owner = makeAddr("owner");
        escrow = new Escrow(owner);

        arbiter = makeAddr("arbiter");
        payee = makeAddr("payee");
        payer = makeAddr("payer");
    }

    function test_Integration_happyPathEscrow() public {
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        escrow.createAgreement{value: 0.2 ether}(payee, arbiter, 2_000_000);
        uint256 agreementId = escrow.nextAgreementId() - 1;

        vm.stopPrank();

        assertEq(address(escrow).balance, 0.2 ether);
        assertEq(payer.balance, 0.8 ether);
        assertEq(uint8(escrow.getAgreements(agreementId).currentState), uint8(Escrow.State.Funded));

        vm.warp(1_500_000);
        vm.prank(payee);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        assertEq(escrow.getAgreements(agreementId).payeeConfirmed, true);

        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);
        vm.stopPrank();

        assertEq(escrow.getAgreements(agreementId).payerConfirmed, true);

        vm.warp(2_100_000);
        vm.prank(payee);
        escrow.releaseFunds(agreementId);

        assertEq(address(escrow).balance, 0);
        assertEq(payee.balance, 0.2 ether);
        assertEq(payer.balance, 0.8 ether);
    }

    function test_Integration_multipleAgreements_happyPath() public {
        vm.deal(payer, 1 ether);
        uint256 nextAgreementId = escrow.nextAgreementId();

        vm.expectEmit(true, true, false, true);
        emit Escrow.NewAgreement(nextAgreementId, payer, 0.2 ether);

        vm.prank(payer);
        escrow.createAgreement{value: 0.2 ether}(payee, arbiter, 2_000_000);
        vm.stopPrank();

        vm.expectEmit(true, true, false, true);
        emit Escrow.NewAgreement(nextAgreementId + 1, payer, 0.3 ether);

        vm.prank(payer);
        escrow.createAgreement{value: 0.3 ether}(payee, arbiter, 2_000_000);
        vm.stopPrank();

        assertEq(address(escrow).balance, 0.5 ether);
        assertEq(payer.balance, 0.5 ether);
        assertEq(uint8(escrow.getAgreements(nextAgreementId).currentState), uint8(Escrow.State.Funded));

        vm.warp(1_500_000);
        vm.prank(payee);
        escrow.payeeRequestCompletion(nextAgreementId);
        vm.stopPrank();

        assertEq(escrow.getAgreements(nextAgreementId).payeeConfirmed, true);

        vm.prank(payer);
        escrow.payerRequestCompletion(nextAgreementId);
        vm.stopPrank();

        assertEq(escrow.getAgreements(nextAgreementId).payerConfirmed, true);

        vm.warp(2_100_000);
        vm.prank(payee);
        escrow.releaseFunds(nextAgreementId);

        assertEq(address(escrow).balance, 0.3 ether);
        assertEq(payee.balance, 0.2 ether);
        assertEq(payer.balance, 0.5 ether);

        assertEq(uint8(escrow.getAgreements(nextAgreementId).currentState), uint8(Escrow.State.Completed));
    }

    function test_Integration_agreementWithDispute() public {
        vm.deal(payer, 0.5 ether);
        vm.prank(payer);

        escrow.createAgreement{value: 0.2 ether}(payee, arbiter, 2_000_000);

        vm.stopPrank();

        vm.warp(1_000_000);

        vm.prank(payee);
        escrow.payeeRequestCompletion(0);
        vm.stopPrank();

        vm.warp(2_500_000);
        vm.prank(payer);
        escrow.raiseDispute(0);
        vm.stopPrank();

        assertEq(uint8(escrow.getAgreements(0).currentState), uint8(Escrow.State.InDispute));

        vm.prank(arbiter);
        escrow.resolveDispute(0, payer);
        vm.stopPrank();

        assertEq(uint8(escrow.getAgreements(0).currentState), uint8(Escrow.State.Completed));
        assertEq(payer.balance, 0.5 ether);
        assertEq(address(escrow).balance, 0 ether);
    }

    function test_Integration_expiredAgreement() public {
        vm.deal(payer, 0.2 ether);

        vm.prank(payer);
        escrow.createAgreement{value: 0.1 ether}(payee, arbiter, 2_000_000);
        vm.stopPrank();

        assertEq(address(escrow).balance, 0.1 ether);
        assertEq(payer.balance, 0.1 ether);

        vm.warp(2_100_000);
        address randomCaller = makeAddr("randomCaller");
        vm.prank(randomCaller);
        escrow.cancelExpiredAgreement(0);
        vm.stopPrank();

        assertEq(address(escrow).balance, 0 ether);
        assertEq(payer.balance, 0.2 ether);
        assertEq(uint8(escrow.getAgreements(0).currentState), uint8(Escrow.State.Canceled));
    }

    function test_Integration_disputeByPayee_thenWrongArbiterResolveShouldRevert() public {
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        escrow.createAgreement{value: 0.2 ether}(payee, arbiter, 2_000_000);
        uint256 agreementId = escrow.nextAgreementId() - 1;
        vm.stopPrank();

        vm.warp(1_100_000);
        vm.prank(payee);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        vm.warp(2_100_000);
        vm.prank(payee);
        escrow.raiseDispute(agreementId);
        vm.stopPrank();

        address fakeArbiter = makeAddr("fakeArbiter");

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidArbiterAddress.selector, fakeArbiter, "msg.sender is not the arbiter of the agreement."
            )
        );

        vm.prank(fakeArbiter);
        escrow.resolveDispute(agreementId, payee);
    }

    function test_Integration_CancelNotAllowed_WhenAgreementIsCompleted() public {
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        escrow.createAgreement{value: 0.2 ether}(payee, arbiter, 2_000_000);
        uint256 agreementId = escrow.nextAgreementId() - 1;

        vm.stopPrank();

        vm.warp(1_500_000);
        vm.prank(payee);
        escrow.payeeRequestCompletion(agreementId);
        vm.stopPrank();

        assertEq(escrow.getAgreements(agreementId).payeeConfirmed, true);

        vm.prank(payer);
        escrow.payerRequestCompletion(agreementId);
        vm.stopPrank();

        assertEq(escrow.getAgreements(agreementId).payerConfirmed, true);

        vm.warp(2_100_000);
        vm.prank(payee);
        escrow.releaseFunds(agreementId);

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidStateForCancel.selector, "Agreement can only be cancelled when it is in Funded state."
            )
        );

        vm.prank(payer);
        escrow.cancelExpiredAgreement(agreementId);
    }
}
