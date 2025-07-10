// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "../src/streamFactory.sol";
import "../src/userPayment.sol";
import "../src/mocUSDC.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";



contract CounterTest is Test {

    using SafeERC20 for IERC20;

    bbungfluid public fluid;
    streamFactory public factory;
    USDC public usdc;

    address public owner;
    address public netflix;
    address public user1;

    function setUp() public {
        owner = vm.addr(0xaa);
        netflix = vm.addr(0x11);
        user1 = vm.addr(0x22);

        usdc = new USDC();
        usdc.acquire(user1);
        factory = new streamFactory(owner);
    }

    function test() public {
        vm.startPrank(owner);
        bytes memory cid = bytes("I'm ipfs - cid");
        fluid = bbungfluid(factory.register(netflix, cid, "netflix", address(usdc)));

        vm.startPrank(netflix);
        fluid.setSecondFee(10, 5e6);
        
        vm.startPrank(user1);
        usdc.approve(address(fluid), 1e9);
        fluid.deposit(user1, 5e6);

        bbungfluid.USERInfo memory check = fluid.viewUSERInfo(user1);

        fluid.startStream(user1, 0);

        vm.warp(block.timestamp + 7200);

        fluid.endStream(user1);

        bbungfluid.USERInfo memory check1 = fluid.viewUSERInfo(user1);

        console.log("sf", fluid.secondFee());
        console.log("User Remain Time", fluid.viewRemainStreamTime(user1) / 60 / 60);
        console.log("Owner profit", fluid.ownerBalance());
        console.log("USDC Balance", usdc.balanceOf(address(fluid)));
    }
}
