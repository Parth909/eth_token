var DappTokenSale = artifacts.require("./DappTokenSale.sol");
var DappToken = artifacts.require("./DappToken.sol");

contract("DappTokenSale", function (accounts) {
  var tokenSaleInstance;
  var tokenInstance;
  var admin = accounts[0];
  var buyer = accounts[1];
  var tokenPrice = 1000000000000000; // In WEI
  var tokensAvailable = 750000; // Provision 75% of Dapp Tokens to `DappTokenSale Contract`
  var numberOfTokens;

  it("Initialized the contract with correct values", function () {
    return DappTokenSale.deployed()
      .then(function (instance) {
        tokenSaleInstance = instance;
        return tokenSaleInstance.address;
      })
      .then(function (address) {
        assert.notEqual(
          address,
          0x0,
          "has contract address(smart contract is there)"
        );
        return tokenSaleInstance.tokenContract();
      })
      .then(function (address) {
        assert.notEqual(address, 0x0, "has DappToken Contract address");
        return tokenSaleInstance.tokenPrice();
      })
      .then(function (price) {
        assert.strictEqual(
          price.toNumber(),
          tokenPrice,
          "token price is correct"
        );
      });
  });

  it("facilitates token buying original", function () {
    return DappToken.deployed()
      .then(function (instance) {
        // Grab tokenInstance first
        tokenInstance = instance;
        return DappTokenSale.deployed();
      })
      .then(function (instance) {
        // Then Grab tokenSaleInstance
        tokenSaleInstance = instance;
        // Admin has all the tokens when `DappToken` is created
        return tokenInstance.transfer(
          tokenSaleInstance.address,
          tokensAvailable,
          { from: admin }
        );
      })
      .then(function (receipt) {
        numberOfTokens = 10;
        return tokenSaleInstance.buyTokens(numberOfTokens, {
          from: buyer, // msg.sender
          value: numberOfTokens * tokenPrice, // in wei
        });
      })
      .then(function (receipt) {
        console.log("===========", receipt);
        assert.strictEqual(receipt.logs.length, 1, "triggers one event");
        assert.strictEqual(
          receipt.logs[0].event,
          "Sell",
          'should be the "Sell" event'
        );
        assert.strictEqual(
          receipt.logs[0].args._buyer,
          buyer,
          "logs the account that purchased the tokens"
        );
        assert.strictEqual(
          receipt.logs[0].args._amount.toNumber(),
          numberOfTokens,
          "logs the number of tokens purchased"
        );
        return tokenSaleInstance.tokensSold();
      })
      .then(function (amount) {
        console.log("===========", amount);
        assert.strictEqual(
          amount.toNumber(),
          numberOfTokens,
          "Increments the number of tokens sold"
        );
        return tokenInstance.balanceOf(buyer);
      })
      .then(function (balance) {
        console.log("===========", balance);
        assert.strictEqual(
          balance.toNumber(),
          numberOfTokens,
          "balance of Buyer must be correct"
        );
        return tokenInstance.balanceOf(tokenSaleInstance.address);
      })
      .then(function (balance) {
        console.log("===========", balance);
        assert.strictEqual(
          balance.toNumber(),
          tokensAvailable - numberOfTokens,
          "balance of DappTokenSale Instance must be correct"
        );
        // Try to buy tokens different from the Ether Value => like underpaying || overpaying
        return tokenSaleInstance.buyTokens(numberOfTokens, {
          from: buyer, // msg.sender
          value: 11, // in wei
        });
      })
      .then(assert.fail)
      .catch(function (error) {
        assert(
          error.message.indexOf("revert") >= 0,
          "Must revert the transaction if overpaying / underpaying"
        );
        // Trying to buy more tokens than the TokenSale Contract has (750000)
        return tokenSaleInstance.buyTokens(10000000, {
          from: buyer, // msg.sender
          value: numberOfTokens * tokenPrice, // in wei
        });
      })
      .then(assert.fail)
      .catch(function (error) {
        assert(
          error.message.indexOf("revert") >= 0,
          "Cannot purchase more tokens than the contract has"
        );
      });
  });

  it("ends token sale", function () {
    return DappToken.deployed()
      .then(function (instance) {
        tokenInstance = instance;
        return DappTokenSale.deployed();
      })
      .then(function (instance) {
        tokenSaleInstance = instance;
        // Try to end sale from account other that the admin
        return tokenSaleInstance.endSale({ from: buyer });
      })
      .then(assert.fail)
      .catch(function (error) {
        assert(
          error.message.indexOf("revert") >= 0,
          "must be an admin to end sale"
        );
        // end sale as admin
        return tokenSaleInstance.endSale({ from: admin });
      })
      .then(function (receipt) {
        // After transferring balance back to admin => admin should have balance 999990
        return tokenInstance.balanceOf(admin);
      })
      .then(async (balance) => {
        assert.strictEqual(
          balance.toNumber(),
          999990,
          "returns all unsold dapp tokens to admin"
        );
        // Check that the contract has no balance
        balance = await web3.eth.getBalance(tokenSaleInstance.address);

        assert.strictEqual(
          parseInt(balance),
          0,
          "balance of tokeSaleInstance should be 0 after transferring all tokens to admin"
        );
      });
  });
});
