// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

contract TokenDistributor is AccessControl {
    bytes32 private constant OPERATOR = keccak256("OPERATOR");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    event Withdrawal(
        address indexed tokenAddress,
        address indexed targetAddress,
        uint256 amount
    );

    event TokenDistribution(
        address indexed tokenAddress,
        address indexed sourceAddress,
        uint256 totalAmount
    );

    /**
     *
     * @dev See {AccessControl-grantRole}
     * Note that in the current setup we do not have access to the
     * list of all operators
     *
     * @param operator the operator's address to be added
     *
     * Requirements:
     * - Only The admin of OPERATOR role can grant it
     *
     */
    function addOperator(address operator) external {
        grantRole(OPERATOR, operator);
    }

    /**
     *
     * @dev See {AccessControl-revokeRole}
     *
     * @param operator the address to be revoked from the operator role
     *
     * Requirements:
     * - Only The admin of OPERATOR role can revoke it
     *
     */
    function revokeOperator(address operator) external {
        revokeRole(OPERATOR, operator);
    }

     /**
     *
     * @dev The contract that correpsonds to the tokenAddress is 
     * invoked through the IERC20 interface for each call. 
     * The same applies for the rest of the functions below.
     *
     * @param tokenAddress the address of the token to be distributed
     * @param addresses list of addresses
     * @param amounts list of amounts
     *
     * Requirements:
     * - tokenAddress corresponds to an ERC20 contract
     * - The length of the two input lists matches
     * - There are enough tokens to spend
     *
     */
    function distribute(
        address tokenAddress,
        address[] calldata addresses,
        uint256[] calldata amounts
    ) external onlyRole(OPERATOR) {
        IERC20 token = IERC20(tokenAddress);
        require(addresses.length == amounts.length, "Invalid input parameters");
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < addresses.length; i++) {
            require(
                token.transfer(addresses[i], amounts[i]),
                "Token distribution failed."
            );
            totalAmount += amounts[i];
        }
        emit TokenDistribution(tokenAddress, address(this), totalAmount);
    }

    /**
     *
     * @param tokenAddress the address of the token to be distributed
     * @param sourceAddress the address where the tokens will be spent from
     * @param addresses list of addresses
     * @param amounts list of amounts
     *
     * Requirements:
     * - tokenAddress corresponds to an ERC20 contract
     * - The length of the two input lists matches
     * - The address of this contract is approved for spending tokens of 
     *   tokenAddress from sourceAddress
     * - There are enough tokens to spend
     *
     */
    function distributeFrom(
        address tokenAddress,
        address sourceAddress,
        address[] calldata addresses,
        uint256[] calldata amounts
    ) external onlyRole(OPERATOR) {
        IERC20 token = IERC20(tokenAddress);
        require(addresses.length == amounts.length, "Invalid input parameters");
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < addresses.length; i++) {
            require(
                token.transferFrom(sourceAddress, addresses[i], amounts[i]),
                "Token distribution failed."
            );
            totalAmount += amounts[i];
        }
        emit TokenDistribution(tokenAddress, sourceAddress, totalAmount);
    }

    /**
     *
     * @param tokenAddress the address of the token to be withdrawan
     * @param targetAddress the address where the tokens will be sent
     * @param amount list of amount
     *
     * Requirements:
     * - tokenAddress corresponds to an ERC20 contract
     * - The length of the two input lists matches
     * - The address of this contract is approved for spending tokens of 
     *   tokenAddress from sourceAddress
     * - There are enough tokens to spend
     *
     */
    function withdraw(
        address tokenAddress,
        address targetAddress,
        uint256 amount
    ) external onlyRole(OPERATOR) {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(targetAddress, amount), "Withdrawal failed.");
        emit Withdrawal(tokenAddress, targetAddress, amount);
    }
}
