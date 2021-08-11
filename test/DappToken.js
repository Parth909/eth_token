var DappToken = artifacts.require("./DappToken.sol");

// /*
contract("DappToken", async (accounts) => {
  it("Initializes the contract with the correct values", async () => {
    let instance = await DappToken.deployed();
    let name = await instance.name();

    assert.strictEqual(name, "DApp Token", "has the correct token name");

    let symbol = await instance.symbol();
    assert.strictEqual(symbol, "DAPP", "has the correct symbol");

    let standard = await instance.standard();
    assert.strictEqual(standard, "DApp Token v1.0", "has the correct standard");
  });

  it("allocates the initial supply upon deployment", async () => {
    let instance = await DappToken.deployed();
    let tokenInstance = await instance.totalSupply();

    assert.strictEqual(
      tokenInstance.toNumber(),
      1000000,
      "Sets the total supply to 1,000,000"
    );

    let balance = await instance.balanceOf(accounts[0]);
    assert.strictEqual(
      balance.toNumber(),
      1000000,
      "Balance of the admin should be 1,000,000"
    );
  });

  it("transfers token ownership", function () {
    return DappToken.deployed()
      .then(function (instance) {
        tokenInstance = instance;
        // Test `require` statement first by transferring something larger than sender's balance
        return tokenInstance.transfer.call(accounts[1], 99999999999999);
      })
      .then(assert.fail)
      .catch(function (error) {
        assert(
          error.message.indexOf("revert") >= 0,
          "error message must contain revert"
        );
        return tokenInstance.transfer.call(accounts[1], 250000, {
          from: accounts[0],
        });
      })
      .then(function (success) {
        // test the boolean
        assert.strictEqual(success, true, "success boolean must be true");
        return tokenInstance.transfer(accounts[1], 250000, {
          from: accounts[0],
        });
      })
      .then(function (receipt) {
        assert.strictEqual(receipt.logs.length, 1, "triggers one event");
        // console.log(receipt.logs);
        assert.strictEqual(
          receipt.logs[0].event,
          "Transfer",
          'should be the "Transfer" event'
        );
        assert.strictEqual(
          receipt.logs[0].args._from,
          accounts[0],
          "logs the account the tokens are transferred from"
        );
        assert.strictEqual(
          receipt.logs[0].args._to,
          accounts[1],
          "logs the account the tokens are transferred to"
        );
        assert.strictEqual(
          receipt.logs[0].args._value.toNumber(),
          250000,
          "logs the transfer amount"
        );
        return tokenInstance.balanceOf(accounts[1]);
      })
      .then(function (balance) {
        assert.strictEqual(
          balance.toNumber(),
          250000,
          "adds the amount to the receiving accouunt"
        );
        return tokenInstance.balanceOf(accounts[0]);
      })
      .then(function (balance) {
        assert.strictEqual(
          balance.toNumber(),
          750000,
          "deducts the amount from the sending account"
        );
      });
  });

  it("approves tokens for delegated transfer", function () {
    return DappToken.deployed()
      .then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.approve.call(accounts[1], 100); // no transaction created
      })
      .then(function (success) {
        assert.strictEqual(success, true, "it returns true");
        return tokenInstance.approve(accounts[1], 100, { from: accounts[0] }); // transaction created
      })
      .then(function (receipt) {
        assert.strictEqual(receipt.logs.length, 1, "triggers one event");
        console.log(receipt.logs);
        assert.strictEqual(
          receipt.logs[0].event,
          "Approval",
          'should be the "Approval" event'
        );
        assert.strictEqual(
          receipt.logs[0].args._owner,
          accounts[0],
          "logs the account the tokens are transferred from"
        );
        assert.strictEqual(
          receipt.logs[0].args._spender,
          accounts[1],
          "logs the account the tokens are transferred to"
        );
        assert.strictEqual(
          receipt.logs[0].args._value.toNumber(),
          100,
          "logs the transfer amount"
        );
        return tokenInstance.allowance(accounts[0], accounts[1]);
      })
      .then(function (allowance) {
        assert.strictEqual(
          allowance.toNumber(),
          100,
          "stores the allowance for delegated transfer"
        );
      });
  });

  it("handles delegated token transfers", function () {
    return DappToken.deployed()
      .then(function (instance) {
        tokenInstance = instance;
        fromAccount = accounts[2];
        toAccount = accounts[3];
        spendingAccount = accounts[4];

        // === SETUP LINE FOR TEST ===
        // Transfer some tokens to FromAccount
        return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
      })
      .then(function (receipt) {
        // Approve spendingAccount to spend 10 tokens from fromAccount
        return tokenInstance.approve(spendingAccount, 10, {
          from: fromAccount, // msg.sender
        });
      })
      .then(function (receipt) {
        // Try transferring something larger than the `fromAccount's` balance using `spendingAccount`
        return tokenInstance.transferFrom.call(fromAccount, toAccount, 99999, {
          from: spendingAccount,
        });
      })
      .then(assert.fail)
      .catch(function (error) {
        // SOMETIMES it gives error => error.messge.indexOf() is not a function bcz of truffle
        // console.log("ERROR MESSAGE", error.message.indexOf("revert"));
        // let idx = error.message.indexOf("revert");
        assert(
          error.message.indexOf("revert") >= 0,
          "Cannot transfer value larger than BALANCE of fromAccount"
        );
        // Try transferring something larger than approved amount
        return tokenInstance.transferFrom.call(fromAccount, toAccount, 20, {
          from: spendingAccount,
        });
      })
      .then(assert.fail)
      .catch(function (error) {
        assert(
          error.message.indexOf("revert") >= 0,
          "Cannot transfer value larger than approved amount"
        );
        return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, {
          from: spendingAccount,
        });
      })
      .then(function (success) {
        assert.strictEqual(success, true, "return value should be true");
        return tokenInstance.transferFrom(fromAccount, toAccount, 10, {
          from: spendingAccount,
        });
      })
      .then(function (receipt) {
        assert.equal(receipt.logs.length, 1, "triggers one event");
        assert.equal(
          receipt.logs[0].event,
          "Transfer",
          'should be the "Transfer" event'
        );
        assert.equal(
          receipt.logs[0].args._from,
          fromAccount,
          "logs the account the tokens are transferred from"
        );
        assert.equal(
          receipt.logs[0].args._to,
          toAccount,
          "logs the account the tokens are transferred to"
        );
        assert.equal(
          receipt.logs[0].args._value,
          10,
          "logs the transfer amount"
        );
        return tokenInstance.balanceOf(fromAccount);
      })
      .then(function (balance) {
        assert.strictEqual(
          balance.toNumber(),
          90,
          "deducts the amount from the sending account"
        );
        return tokenInstance.balanceOf(toAccount);
      })
      .then(function (balance) {
        assert.strictEqual(
          balance.toNumber(),
          10,
          "adds the amount to the receiving account"
        );
        return tokenInstance.allowance(fromAccount, spendingAccount);
      })
      .then(function (allowance) {
        // After spending the allowed tokens the balance is ZERO
        assert.strictEqual(
          allowance.toNumber(),
          0,
          "deducts the amount from allowance"
        );
      });
  });
});
// */

// Promise way of doing things

/*
// 1. `DappToken.deployed()` will run when it is resolved it's `.then()` will run
// 2. `tokenInstance.totalSupply()` will run when it is resolved next `.then()` will run
// 3. After that `inner return` will run then the `outer return` will run
contract("DappToken", function (accounts) {
  var tokenInstance;

  it("sets the total supply upon deployment", function () {
    return DappToken.deployed()
      .then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.totalSupply();
      })
      .then(function (totalSupply) {
        assert.strictEqual(
          totalSupply.toNumber(),
          1000000,
          "Sets the total supply to 1,000,000"
        );

        return tokenInstance.balanceOf(accounts[0]);
      })
      .then(function (adminBalance) {
        assert.strictEqual(
          adminBalance.toNumber(),
          1000000,
          "It allocates the initial supply to the admin account"
        );
      });
  });
});
*/
