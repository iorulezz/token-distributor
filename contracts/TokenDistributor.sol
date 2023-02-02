// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

contract TokenDistributor is AccessControl {
    bytes32 private constant OPERATOR = keccak256("OPERATOR");

    // mapping for which contracts you can operate with EXPLORE THIS OPTION FOR GAS

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier notZero(address operator) {
        require(
            operator != address(0),
            "The zero address is not allowed as input"
        );
        _;
    }

    // TODO: Add missing events
    // event definitions
    event Withdrawal(
        address indexed tokenAddress,
        address indexed targetAddress,
        uint256 amount
    );

    function addOperator(address operator) external notZero(operator) {
        grantRole(OPERATOR, operator);
    }

    function revokeOperator(address operator) external notZero(operator) {
        revokeRole(OPERATOR, operator);
    }

    // To distribute tokens from Contract to the provided list of token holders with respective amount
    function distribute(
        address tokenAddress,
        address[] calldata addresses,
        uint256[] calldata amounts
    ) external onlyRole(OPERATOR) {
        IERC20 token = IERC20(tokenAddress);
        require(addresses.length == amounts.length, "Invalid input parameters");
        console.log("Distributing tokens of ", tokenAddress);

        for (uint256 i = 0; i < addresses.length; i++) {
            require(
                token.transfer(addresses[i], amounts[i]),
                "Batch transfer failed."
            );
            console.log("Sending amount ", amounts[i], " to address ", addresses[i]);
        }
    }

    // to distribute tokens held at a different address. msg.sender must be approved to spend.
    function distributeFrom(
        address tokenAddress,
        address sourceAddress,
        address[] calldata addresses,
        uint256[] calldata amounts
    ) external onlyRole(OPERATOR) {
        IERC20 token = IERC20(tokenAddress);
        require(addresses.length == amounts.length, "Invalid input parameters");
        console.log("Distributing tokens of ", tokenAddress);

        for (uint256 i = 0; i < addresses.length; i++) {
            require(
                token.transferFrom(sourceAddress, addresses[i], amounts[i]),
                "Batch transfer failed."
            );
            console.log("Sending amount ", amounts[i], " to address ", addresses[i]);
        }
    }

    // TODO: add function to mint and distribute,
    // NOTE: you have to be the owner of the token contract

    // Withdraw tokens held at this contract
    function withdraw(
        address tokenAddress,
        address targetAddress,
        uint256 amount
    ) external onlyRole(OPERATOR) {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(targetAddress, amount), "Withdrawal failed.");
        emit Withdrawal(tokenAddress, targetAddress, amount);
    }

    // Add token in the mapping of operatable tokens
    // CHECK: Is it better gas-wise to save IERC20 objects? e.g. mapping address => IERC20
    // Alternative would be to give the address and create the IRC20 object for each operation
}
