const DappToken = artifacts.require("./DappToken.sol");
const DappTokenSale = artifacts.require("./DappTokenSale.sol");

module.exports = function (deployer) {
  // 2nd args onwards are for constructor
  deployer.deploy(DappToken, 1000000).then(function () {
    let tokenPrice = 1000000000000000; // 0.001 Ether
    // 2nd args onwards are for constructor
    return deployer.deploy(DappTokenSale, DappToken.address, 1000000000000000);
  });
};
