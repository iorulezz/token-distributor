// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BatchTransactionCommander is AccessControl {
    bytes32 public constant OPERATOR = keccak256("OPERATOR");
    
    // mapping for which contracts you can operate with
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // function distribute, given token, addresses and amounts
    // Variant 1: this contract holds tokens
    // Variant 2: tokens are held at different address, contract must be approved to spend

    // function mint and distribute NOTE: you have to be the owner of the token contract

    // Withdraw tokens held at this contract

    // Add token in the mapping of operatable tokens
    // CHECK: Is it better gas-wise to save IERC20 objects? e.g. mapping address => IERC20
    // Alternative would be to give the address and create the IRC20 object for each operation

    
}
