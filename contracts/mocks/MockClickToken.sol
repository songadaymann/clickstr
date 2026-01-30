// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockClickToken
 * @notice Mock ERC20 token for testing StupidClicker
 */
contract MockClickToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Click Token", "CLICK") {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Mint tokens to any address (for testing)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
