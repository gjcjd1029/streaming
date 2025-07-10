// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/streamFactory.sol";
import "../src/userPayment.sol";
import "../src/mocUSDC.sol";

contract Deploy is Script {

    streamFactory public factory;
    address public owner;
    USDC public usdc;

    function setUp() public {
        vm.startBroadcast();
        owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        factory = new streamFactory(owner);
        usdc = new USDC();
        usdc.acquire(owner);
        console.log("usdc", address(usdc));
        console.log("factory", address(factory));
    }

    function run() public {    
    }
}
