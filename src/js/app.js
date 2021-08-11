App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function () {
    console.log("App initialized...");
    return App.initWeb3();
  },
  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
      web3 = new Web3(App.web3Provider);
    }

    return App.initContracts();
  },

  initContracts: function () {
    // Get the JSON contract abstractions in build/contracts
    $.getJSON("DappTokenSale.json", function (dappTokenSale) {
      // Truffle can read the contracts json & turn them into workable js data
      App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
      App.contracts.DappTokenSale.setProvider(App.web3Provider);
      App.contracts.DappTokenSale.deployed().then(function (dappTokenSale) {
        console.log("Dapp Token Sale Address", dappTokenSale.address);
      });
    }).done(function () {
      $.getJSON("DappToken.json", function (dappToken) {
        App.contracts.DappToken = TruffleContract(dappToken);
        App.contracts.DappToken.setProvider(App.web3Provider);
        App.contracts.DappToken.deployed().then(function (dappToken) {
          console.log("Dapp Token Address", dappToken.address);
          // Listen for events
          App.listenForEvents();
          return App.render();
        });
      });
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.DappTokenSale.deployed().then(function (instance) {
      // Watch the sell event
      instance
        .Sell(
          {},
          {
            fromBlock: 0,
            toBlock: "latest",
          }
        )
        .watch(function (error, event) {
          console.log("event triggered", event);
          // RERENDER THE PAGE after the SELL event
          App.render();
        });
    });
  },

  render: function () {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (!err) {
        App.account = account;
        $("#accountAddress").html("Your Account : " + account);
      }
    });

    // Load DappTokenSale Contract
    App.contracts.DappTokenSale.deployed()
      .then(function (instance) {
        dappTokenSaleInstance = instance;
        return dappTokenSaleInstance.tokenPrice();
      })
      .then(function (tokenPrice) {
        App.tokenPrice = tokenPrice.toNumber();
        $(".token-price").html(
          web3.fromWei(App.tokenPrice, "ether") // from Wei to Ether
        );
        return dappTokenSaleInstance.tokensSold();
      })
      .then(function (tokensSold) {
        App.tokensSold = tokensSold.toNumber();
        $(".tokens-sold").html(App.tokensSold);
        $(".tokens-available").html(App.tokensAvailable);

        var progressPercent = (App.tokensSold / App.tokensAvailable) * 100;
        $("#progress").css("width", progressPercent + "%");

        // Load DappToken Contract
        App.contracts.DappToken.deployed()
          .then(function (instance) {
            dappTokenInstance = instance;
            return dappTokenInstance.balanceOf(App.account);
          })
          .then(function (balance) {
            $(".dapp-balance").html(balance.toNumber());
            App.loading = false;
            loader.hide();
            content.show();
          });
      })
      .catch(function (error) {
        App.loading = false;
        loader.show();
        content.hide();
      });
  },

  buyTokens: function () {
    $("#content").hide();
    $("#loader").show();
    var numberOfTokens = $("#numberOfTokens").val();
    App.contracts.DappTokenSale.deployed()
      .then(function (instance) {
        return instance.buyTokens(numberOfTokens, {
          from: App.account,
          value: numberOfTokens * App.tokenPrice,
          gas: 500000,
        });
      })
      .then(function (result) {
        console.log("Tokens bought...");
        $("form").trigger("reset");
        // After buying tokens wait for SELL event to trigger don't immediately show the form
        // $("#content").show();
        // $("#loader").hide();
      });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});

// init() => initWeb3() => initContracts() [DappTokenSale => DappToken] => render()
