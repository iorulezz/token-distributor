// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PamelaToken is ERC20, Ownable {
    constructor() ERC20("PamelaToken", "PML") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract AndreasToken is ERC20, Ownable {
    constructor() ERC20("AndreasToken", "ADR") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
