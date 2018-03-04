var CoinStack = artifacts.require("./CoinStack.sol");

contract('CoinStack', function(accounts) {

  var gameAdmin = accounts[0];
  var user1 = accounts[1];
  var user2 = accounts[2];

  // Check if first coin is correctly initialized after contract deployment
  it("Checking initial coin info.", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      return gameInstance.getNumCoins.call();
    }).then(function(numCoins){
      assert.equal(numCoins,1,"Should have exactly one coin. Num coin:"+numCoins);
      return gameInstance.isThereACoinAtCoordinates.call(0,0);
    }).then(function(existAt00) {
      assert(existAt00,"Should have a coin at (0,0)");
      return gameInstance.getAllCoins.call();
    }).then(function(allCoins) {
      assert.equal(allCoins.length, 1, "The length of coinCoordinates should be 1.");
      assert.equal(allCoins[0], 0x0, "The first coord in coinCoordinates should be 0x0.");
      return gameInstance.coordinatesToAddresses.call(0x0);
    }).then(function(coinOwner){
      assert.equal(coinOwner, gameAdmin, "The first coin should be owned by admin.");
    });

  });

  //
  // admin
  // ------------------
  // inGameBalance:
  // admin: 0

  // Check contract balance, admin's in-game balance right after contract deployment
  it("Checking contract balance, admin's in-game balance right after contract deployment.", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      return gameInstance.balances.call(gameAdmin);
    }).then(function(inGameBalance){
      assert(inGameBalance.eq(0),"Admin account should have 0 in-game balance after deployment.");
    //   return web3.eth.getBalance(gameAdmin);
    // }).then(function(balance) {
    //   // need implicitly toNumber() since isBelow/isAbove dont do type conversion
    //   assert.isBelow(balance.toNumber(),web3.toWei(100,"ether"),"Admin account should have less than 100 ethers after paying gas for deployment.");
    //   assert.isAbove(balance.toNumber(),web3.toWei(98,"ether"),"Should not have spent more than 2 ethers for deployment.");
      return web3.eth.getBalance(gameInstance.address);
    }).then(function(contractBalance){
      assert(contractBalance.eq(web3.toWei(0,"ether")),"Contract should have 0 ether.");
    });
  });

  //
  // user1
  // admin
  // ------------------
  // inGameBalance:
  // admin: 0.01
  // user1: 0

  // Check if event is fired after placing a coin.
  it("Checking if event is fired after placing a coin. (Total: 2 coins)", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      return gameInstance.placeCoin(0,1,{from:user1,value: web3.toWei(0.01, "ether")});
    }).then(function(result){
      //check event
      assert.equal(result.logs.length, 1, "should have received one event");
      assert.equal(result.logs[0].event, "coinPlacedEvent", "event name should be coinPlacedEvent");
      assert.equal(result.logs[0].args._coord, 0x00000001, "coord must be (0,1)");
      assert.equal(result.logs[0].args._coinOwner, user1, "coin owner should be user1.");
      return gameInstance.balances.call(gameAdmin);
    });
  });

  //
  // user1
  // admin
  // ------------------
  // inGameBalance:
  // admin: 0.01
  // user1: 0

  // Check admin balance, user1 balance, and contract balance after placing a coin
  it("Checking admin balance, user1 balance, and contract balance after placing a coin. (Total: 2 coins)", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      return gameInstance.balances.call(gameAdmin);
    }).then(function(gameAdminInGameBalance){
      // check admin in-game balance
      assert(gameAdminInGameBalance.eq(web3.toWei(0.01, "ether")),"Admin account should have 0.01 in-game balance after user1's placeCoin.");
      return gameInstance.balances.call(user1);
    }).then(function(user1InGameBalance){
      // check user1 in-game balance
      assert(user1InGameBalance.eq(web3.toWei(0, "ether")),"User1 should have 0 in-game balance after placing a coin.");
      return web3.eth.getBalance(gameInstance.address);
    }).then(function(contractBalance){
      assert(contractBalance.eq(web3.toWei(0.01,"ether")),"Contract should have 0.01 ether.");
    });
  });

  //
  // user1
  // admin
  // ------------------
  // inGameBalance:
  // admin: 0.01
  // user1: 0

  // Check second coin existance and coordinates, owner
  it("Checking second coin existance and position. (Total: 2 coins)", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      return gameInstance.getNumCoins.call();
    }).then(function(numCoins){
      // check numCoins
      assert.equal(numCoins,2,"Should have exactly 2 coins.");
      return gameInstance.isThereACoinAtCoordinates.call(0,1);
    }).then(function(existAt01) {
      // check coin exists at (0,1)
      assert(existAt01,"Should have a coin at (0,1)");
      return gameInstance.getAllCoins.call();
    }).then(function(allCoins) {
      // check second coin's coordinate
      assert.equal(allCoins.length, 2, "The length of coinCoordinates should be 2.");
      assert.equal(allCoins[1], 0x00000001, "The second coord in coinCoordinates should be 0x00000001.");
      return gameInstance.coordinatesToAddresses.call(0x00000001);
    }).then(function(coinOwner){
      // check second coin's owner
      assert.equal(coinOwner, user1, "The second coin should be owned by user1.");
      return web3.eth.getBalance(gameInstance.address);
    }).then(function(contractBalance){
      assert(contractBalance.eq(web3.toWei(0.01,"ether")),"Contract should have 0.01 ether.");
    });
  });

  // user2
  // user1
  // admin
  // ------------------
  // inGameBalance:
  // admin: 0.0102
  // user1: 0.0198
  // user2: 0.04

  // Check user1, user2 and contract balance after user2 placing a coin with excess amount (0.06 ether instead of 0.02).
  it("Checking user1, user2 and contract balance after user2 placing a coin with excess amount (0.06 ether instead of 0.02). (Total: 3 coins)", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      return gameInstance.placeCoin(0,2,{from:user2,value: web3.toWei(0.06, "ether")});
    }).then(function(result){
      // check numCoins
      return gameInstance.balances.call(gameAdmin);
    }).then(function(gameAdminInGameBalance){
      // check if transaction fee has been credited to admin in-game balance
      assert(gameAdminInGameBalance.eq(web3.toWei(0.01+0.02*0.01, "ether")),"Admin account should have 0.0102 in-game balance after user2's placeCoin.");
      return gameInstance.balances.call(user1);
    }).then(function(user1InGameBalance){
      // check user1 in-game balance
      assert(user1InGameBalance.eq(web3.toWei(0.02*0.99, "ether")),"User1 should have 0.0198 in-game balance after user2 placing on top.");
      return gameInstance.balances.call(user2);
    }).then(function(user2InGameBalance){
      // check user2 in-game balance
      assert(user2InGameBalance.eq(web3.toWei(0.04, "ether")),"Users should have 0.04 in-game balance after paying excess amount of 0.04.");
      return web3.eth.getBalance(gameInstance.address);
    }).then(function(contractBalance){
      // check contract balance
      assert(contractBalance.eq(web3.toWei(0.07,"ether")),"Contract should have 0.07 ether.");
    });
  });

  // user2
  // user1
  // admin | user2 | user2 | user2
  // ------------------------------
  // inGameBalance:
  // admin: 0.0102 + 0.005 = 0.0152
  // user1: 0.0198
  // user2: 0.04 - 0.005*3 = 0.025
  // jackpot: 0.01
  // contract: 0.01 + 0.0198 + 0.0152 + 0.025 = 0.07

  // Check if only the payment of first 2 bottom coins goes to jackpot.

  it("Checking if only the payment of first 2 bottom coins goes to jackpot. (Total: 6 coins)", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      return gameInstance.reserveForJackpot.call();
    }).then(function(jackpotReserve){
      // check jackpotReserve==0
      assert(jackpotReserve.eq(0),"Jackpot reserve should be 0 at this point.");
      // place a coin at bottom
      // value is 0 since user2 has 0.04 ether in-game balance already.
      return gameInstance.placeCoin(1,0,{from:user2,value: web3.toWei(0, "ether")});
    }).then(function(result){
      return gameInstance.reserveForJackpot.call();
    }).then(function(jackpotReserve){
      // check jackpotReserve==0.005
      assert(jackpotReserve.eq(web3.toWei(0.005,"ether")),"Jackpot reserve should be 0.005 at this point.");
      // place another coin at bottom
      return gameInstance.placeCoin(2,0,{from:user2,value: web3.toWei(0, "ether")});
    }).then(function(result){
      return gameInstance.reserveForJackpot.call();
    }).then(function(jackpotReserve){
      // check jackpotReserve==0.01
      assert(jackpotReserve.eq(web3.toWei(0.01,"ether")),"Jackpot reserve should be 0.01 at this point.");
      return gameInstance.placeCoin(3,0,{from:user2,value: web3.toWei(0, "ether")});
    }).then(function(result){
      return gameInstance.reserveForJackpot.call();
    }).then(function(jackpotReserve){
      // check jackpotReserve==0.01
      assert(jackpotReserve.eq(web3.toWei(0.01,"ether")),"Jackpot reserve should be 0.01 at this point.");
      return gameInstance.balances.call(gameAdmin);
    }).then(function(gameAdminInGameBalance){
      // check admin in-game balance
      assert(gameAdminInGameBalance.eq(web3.toWei(0.0152, "ether")),"Admin account should have 0.0152 in-game balance at this point.");
      return web3.eth.getBalance(gameInstance.address);
    }).then(function(contractBalance){
      assert(contractBalance.eq(web3.toWei(0.07,"ether")),"Contract should have 0.07 ether.");
      return gameInstance.getNumCoins.call();
    }).then(function(numCoins){
      assert(numCoins.eq(6),"number of coins should be 6.")
    });
  });

  // user2
  // user1
  // admin | user2 | user2 | user2
  // ------------------------------
  // inGameBalance:
  // admin: 0.0152
  // user1: 0.0198 - 0.0198 = 0
  // user2: 0.025
  // jackpot: 0.01
  // contract: 0.07 - 0.0198 = 0.0502

  // Check if withdrawl() is working properly.

  it("Checking if withdrawl() is working properly. (Total: 6 coins)", function() {
    var oldBalance,inGameBalance,gasUsed,gasPrice;
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      return web3.eth.getBalance(user1);
    }).then(function(balance){
      oldBalance = balance;
      return gameInstance.balances.call(user1);
    }).then(function(balance){
      inGameBalance = balance;
      assert(inGameBalance.eq(web3.toWei(0.0198,'ether')),"user1 should have 0.0198 ether in game balance.");
      gasPrice = web3.eth.gasPrice;
      return gameInstance.withdrawBalance(web3.toWei(0.0198,'ether'),{from:user1,value:0,gasPrice:gasPrice});
    }).then(function(result){
      gasUsed = result.receipt.gasUsed;
      return gameInstance.balances.call(user1);
    }).then(function(newInGameBalance){
      assert(newInGameBalance.eq(0),"New in-game balance should be 0 after withdraw.")
      return web3.eth.getBalance(user1);
    }).then(function(newBalance){
      var gasCost = gasPrice.times(gasUsed);
      var expectedBalance = inGameBalance.plus(oldBalance).minus(gasCost);
      // console.log('old balance: '+oldBalance.toNumber());
      // console.log('game balance:   '+inGameBalance.toNumber());
      // console.log('gas cost:         '+gasCost);
      // console.log('new balance: '+newBalance.toNumber());
      // console.log('expected:    '+expectedBalance.toNumber());
      assert(newBalance.eq(expectedBalance),"New balance should equal old balance + in game balance - gas cost, after withdrawal");
    });


  });

  // user2
  // user1
  // admin | user2 | user2 | user2
  // ------------------------------
  // inGameBalance:
  // admin: 0.0152
  // user1: 0
  // user2: 0.025
  // jackpot: 0.01
  // contract: 0.0502

  // Check exceptions in placeCoin() are thrown when:
  // 1. Attempt to place coin at existing coin
  // 2. Attempt to place coin at an invalid position ("Floating coin")
  // 3. Attempt to place coin with insufficient fund
  // 4. Attempt to place coin on a locked column

  it("Checking exceptions are correctly thrown when calling placeCoin()", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      // 1. Attempt to place coin at existing coin
      return gameInstance.placeCoin(0,1,{from:user2,value: web3.toWei(0, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      console.log(error.message)
      assert(true);
    })
    .then(function() {
      // check inGameBalance stays the same when transaction fails
      return gameInstance.balances.call(user2);
    }).then(function(user2InGameBalance){
      assert(user2InGameBalance.eq(web3.toWei(0.025,'ether')),"User 2 balance should stay the same when transaction fails.")
      // 2. Attempt to place coin at an invalid position
      return gameInstance.placeCoin(1,2,{from:user1,value: web3.toWei(1, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      console.log(error.message)
      assert(true);
    })
    .then(function() {
      // check inGameBalance stays the same when transaction fails
      return gameInstance.balances.call(user1);
    })
    .then(function(user1InGameBalance){
      assert(user1InGameBalance.eq(web3.toWei(0,'ether')),"User 1 balance should stay the same when transaction fails.")
      // 3. Attempt to place coin with insufficient fund
      return gameInstance.placeCoin(1,1,{from:user1,value: web3.toWei(0, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      console.log(error.message)
      assert(true);
    })
    .then(function(){
      // 4. Attempt to place coin on a locked column
      return gameInstance.placeCoin(20,0,{from:user1,value: web3.toWei(1, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      console.log(error.message)
      assert(true);
    })
    .then(function(){
      // check in game balance stay the same
      return gameInstance.balances.call(user1);
    }).then(function(user1InGameBalance){
      assert(user1InGameBalance.eq(web3.toWei(0,'ether')),"User 1 balance should stay the same when transaction fails.");
    });
  });

  // user2
  // user1
  // admin | user2 | user2 | user2
  // ------------------------------
  // inGameBalance:
  // admin: 0.0152
  // user1: 0
  // user2: 0.025
  // jackpot: 0.01
  // contract: 0.0502

  // Check exceptions in withdrawBalance() are thrown when:
  // 1. Attempt to withdraw 0
  // 2. Attempt to withdraw funds more than the user owns

  it("Checking exceptions are correctly thrown when calling withdrawBalance()", function() {
    return CoinStack.deployed().then(function(instance) {
      gameInstance = instance;
      // 1. Attempt to withdraw 0
      return gameInstance.withdrawBalance(web3.toWei(0, "ether"),{from:user1,value: web3.toWei(0, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      console.log(error.message)
      assert(true);
    })
    .then(function(){
      return gameInstance.balances.call(user2);
    }).then(function(balance){
      // assert user2 in game balance stays the same when withdrawal fail
      assert(balance.eq(web3.toWei(0.025,'ether')),"user2 should have 0.025");
      // 2. Attempt to withdraw funds more than the user owns
      return gameInstance.withdrawBalance(balance.plus(1),{from:user2,value: web3.toWei(0, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      console.log(error.message)
      assert(true);
    }).then(function(){
      return gameInstance.balances.call(user2);
    }).then(function(balance){
      // assert user2 in game balance stays the same when withdrawal fail
      assert(balance.eq(web3.toWei(0.025,'ether')),"user2 should have 0.025");
    });

  });

});
