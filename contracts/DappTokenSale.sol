// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./DappToken.sol";

contract DappTokenSale {
    address payable admin; // don't want to expose the admin
    // public vars & mapping give us getter funcs
    DappToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address _buyer, uint256 _amount);

    constructor(DappToken _tokenContract, uint256 _tokenPrice) public {
        // Assign an admin
        admin = msg.sender; // person who deployed the contract

        // Token Contract
        tokenContract = _tokenContract;

        // Token Price
        tokenPrice = _tokenPrice;
    }

    // safe multiply https://github.com/dapphub/ds-math/blob/master/src/math.sol
    function multiply(uint256 x, uint256 y) internal pure returns (uint256 z) {
        // doing some math operations to check if it is a INTEGER & NUMBER
        require(y == 0 || (z = x * y) / y == x);
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        // Require that value is equal to tokens
        require(msg.value == multiply(_numberOfTokens, tokenPrice));

        // Require that the contract has enough tokens
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);

        // Require transfer is successful (using transfer from DappToken.sol) => msg.sender is the buyer
        require(tokenContract.transfer(msg.sender, _numberOfTokens));

        // Keep track of no of tokens sold
        tokensSold += _numberOfTokens;

        // Sell Event
        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        // Require that only an `admin` can do this
        require(msg.sender == admin);

        // Require to Transfer remaining dapp tokens to admin
        require(
            tokenContract.transfer(
                admin,
                tokenContract.balanceOf(address(this))
            )
        );

        // UPDATE: Let's not destroy the contract here
        // Just transfer the balance to the admin
        admin.transfer(address(this).balance);
    }
}
