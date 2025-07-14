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

    function test_RevertWhen_deadlineIsOutDated() public {
        uint256 fake_time = 1_000_000;
        vm.warp(fake_time);

        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidDeadline.selector,
                block.timestamp - 1 days,
                "Deadline should be time in future"
            )
        );
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        escrow.createAgreement{value: 0.1 ether}(
            payee,
            arbiter,
            block.timestamp - 1 days
        );
    }
    function test_RevertWhen_AmountIsZero() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidAmount.selector,
                0,
                "Amount must be greater than 0"
            )
        );

        vm.prank(payer);
        escrow.createAgreement{value: 0}(
            payee,
            arbiter,
            block.timestamp + 1 days
        );
    }
    function test_RevertWhen_PayeeAddressIsInvalid() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                Escrow.InvalidPayeeAddress.selector,
                address(0),
                "The payee address in Invalid"
            )
        );

        payee = address(0);
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        escrow.createAgreement{value: 0.1 ether}(
            payee,
            arbiter,
            block.timestamp + 1 days
        );
    }
    function test_createAgreement_handleNextAgreementId() public {
        address payer1 = makeAddr("payer1");
        address payer2 = makeAddr("payer2");

        vm.deal(payer1, 1 ether);
        vm.deal(payer2, 1 ether);

        vm.prank(payer1);
        escrow.createAgreement{value: 0.1 ether}(
            payee,
            arbiter,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        assertEq(escrow.nextAgreementId(), uint(1));
        vm.prank(payer2);
        escrow.createAgreement{value: 0.1 ether}(
            payee,
            arbiter,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        assertEq(escrow.nextAgreementId(), uint(2));
    }
    function test_createAgreement_handleStorePayers() public {
        address payer1 = makeAddr("payer1");
        address payer2 = makeAddr("payer2");

        vm.deal(payer1, 1 ether);
        vm.deal(payer2, 1 ether);

        vm.prank(payer1);
        escrow.createAgreement{value: 0.1 ether}(
            payee,
            arbiter,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        vm.prank(payer2);
        escrow.createAgreement{value: 0.1 ether}(
            payee,
            arbiter,
            block.timestamp + 1 days
        );
        vm.stopPrank();

        assertEq(escrow.getAgreements(uint(0)).payer, payer1);
        assertEq(escrow.getAgreements(uint(1)).payer, payer2);
    }
    function test_createAgreement_eventHappened() public {
        uint nextAgreementId = escrow.nextAgreementId();
        uint256 expectedAmount = 0.1 ether;

        vm.expectEmit(true, false, false, true);
        emit Escrow.NewAgreement(nextAgreementId, payer, expectedAmount);

        vm.deal(payer, 1 ether);
        vm.prank(payer);

        escrow.createAgreement{value: 0.1 ether}(
            payee,
            arbiter,
            block.timestamp + 1 days
        );
    }
}
