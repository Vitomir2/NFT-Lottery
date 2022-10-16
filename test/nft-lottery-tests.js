const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { FakeContract, smock } = require('@defi-wonderland/smock');

// chai.should();
// chai.use(smock.matchers);

describe("NFTLottery", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  let accounts;

  let tokenName = "LotteryTicket";
  let tokenSymbol = "LT";
  let lotteryInstance;

  let initialTicketPrice = ethers.utils.parseEther("0.1");
  let newTicketPrice = ethers.utils.parseEther("0.5");
  let lotteryDuration = 60; // 1 minute in seconds

  before(async function() {
    accounts = await ethers.getSigners();
  });

  describe.only("Initialize", async function() {
    it("should deploy the lottery ticket NFT contract successfully", async function() {
      await deployContract();

      expect(await lotteryInstance.name()).to.equal(tokenName);
      expect(await lotteryInstance.symbol()).to.equal(tokenSymbol);
      expect(await lotteryInstance.ticketPrice()).to.equal(initialTicketPrice);
    });
  });

  before(async function() {
    await deployContract();
  });

  //todo: move the revert strings in a collection that can be easily accessed
  describe("Reverts before the lottery has started", async function() {
    it("should fail to enter the lottery when it is still not open", async function() {
      await expect(lotteryInstance.connect(accounts[0])
        .enterLottery({ value: initialTicketPrice })
      ).to.be.revertedWith("NFTLottery: The lottery is not open");
    });

    it("should fail to award a surprise winner when the lottery is still not open", async function() {
      await expect(lotteryInstance.connect(accounts[0])
        .awardSurpriseWinner()
      ).to.be.revertedWith("NFTLottery: The lottery is not open");
    });

    it("should fail when non-owner user try change the ticket price", async function() {
      await expect(lotteryInstance.connect(accounts[1])
        .setTicketPrice(initialTicketPrice)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail when the owner try to set 0 ETH ticket price", async function() {
      await expect(lotteryInstance.connect(accounts[0])
        .setTicketPrice(0)
      ).to.be.revertedWith("NFTLottery: _price == 0");
    });

    it("should fail when non-owner user try to start the lottery", async function() {
      await expect(lotteryInstance.connect(accounts[1])
        .startLottery(0, 0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail when the owner try to start the lottery at past time", async function() {
      await expect(lotteryInstance.connect(accounts[0])
        .startLottery(0, Date.now())
      ).to.be.revertedWith("NFTLottery: _startAt == 0");
    });

    it("should fail when the owner try to set the end of the lottery less before the start", async function() {
      let startAt = Date.now();
      await expect(lotteryInstance.connect(accounts[0])
        .startLottery(startAt, startAt - 1)
      ).to.be.revertedWith("NFTLottery: End time should be after the start time");
    });
  });

  describe("Reverts after the lottery has started", async function() {
    let startAt = Math.floor(Date.now() / 1000) - 10; //* exclude 10 seconds to ensure it has started
    let endAt = startAt + lotteryDuration;

    it("should start the lottery successfully", async function() {
      await lotteryInstance.connect(accounts[0]).startLottery(ethers.BigNumber.from(startAt), ethers.BigNumber.from(endAt));

      expect(await lotteryInstance.startAt()).to.equal(startAt);
      expect(await lotteryInstance.endAt()).to.equal(endAt);
    });

    it("should fail when there are no participants and one try to reward a surprise winner", async function() {
      await expect(lotteryInstance.connect(accounts[0])
        .awardSurpriseWinner()
      ).to.be.revertedWith("NFTLottery: no participants in the lottery");
    });

    it("should fail when the user try to enter the lottery with less funds than the lottery ticket", async function() {
      await expect(lotteryInstance.connect(accounts[0])
        .enterLottery({ value: ethers.utils.parseEther("0.01") })
      ).to.be.revertedWith("NFTLottery: msg.value < ticketPrice");
    });

    it("should fail when a user try to draw a winner before the lottery ends", async function() {
      await expect(lotteryInstance.connect(accounts[0])
        .endLottery()
      ).to.be.revertedWith("NFTLottery: The Lottery time is not finished");
    });
  });

  describe("Successfully set state variables", async function() {
    it("should set new ticket price", async function() {
      await lotteryInstance.connect(accounts[0]).setTicketPrice(newTicketPrice);
      expect(await lotteryInstance.ticketPrice()).to.equal(newTicketPrice);
    });
  });

  describe("Successfully set state variables", async function() {
    it("should set new ticket price", async function() {
      await lotteryInstance.connect(accounts[0]).setTicketPrice(newTicketPrice);
      expect(await lotteryInstance.ticketPrice()).to.equal(newTicketPrice);
    });
  });

  describe("Successfully play and finish the lottery", async function() {
    let fundsToGatherBigNum = newTicketPrice.mul(ethers.BigNumber.from(5));

    before(async function() {
      let startAt = Math.floor(Date.now() / 1000) - 10; //* exclude 10 seconds to ensure it has started
      let endAt = startAt + lotteryDuration;
      await lotteryInstance.connect(accounts[0]).startLottery(ethers.BigNumber.from(startAt), ethers.BigNumber.from(endAt));
    });

    it("should enter the lottery with 5 accounts", async function() {
      await lotteryInstance.enterLottery({ value: newTicketPrice });
      await lotteryInstance.connect(accounts[1]).enterLottery({ value: newTicketPrice });
      await lotteryInstance.connect(accounts[2]).enterLottery({ value: newTicketPrice });
      await lotteryInstance.connect(accounts[3]).enterLottery({ value: newTicketPrice });
      await lotteryInstance.connect(accounts[4]).enterLottery({ value: newTicketPrice });

      expect(await lotteryInstance.balanceOf(accounts[0].address)).to.equal(ethers.BigNumber.from(1));
      expect(await lotteryInstance.balanceOf(accounts[1].address)).to.equal(ethers.BigNumber.from(1));
      expect(await lotteryInstance.balanceOf(accounts[2].address)).to.equal(ethers.BigNumber.from(1));
      expect(await lotteryInstance.balanceOf(accounts[3].address)).to.equal(ethers.BigNumber.from(1));
      expect(await lotteryInstance.balanceOf(accounts[4].address)).to.equal(ethers.BigNumber.from(1));
      expect(await lotteryInstance.getETHBalance()).to.equal(fundsToGatherBigNum);
    });

    it("should award one random participant", async function() {
      await lotteryInstance.awardSurpriseWinner();

      let predictedLeftBalance = fundsToGatherBigNum.div(ethers.BigNumber.from(2));
      expect(await lotteryInstance.getETHBalance()).to.equal(predictedLeftBalance);
    });

    it("should wait the lottery to end and distribute the left balance to another random winner", async function() {
      // setTimeout(async function() {
      //   await lotteryInstance.endLottery();

      //   expect(await lotteryInstance.getETHBalance()).to.equal(ethers.BigNumber.from(0));
      //   done();
      // }, 60000);

      console.log(await lotteryInstance.endAt());
      // await lotteryInstance.endLottery();

      // expect(await lotteryInstance.getETHBalance()).to.equal(ethers.BigNumber.from(0));
    });
  });

  //todo add a test to upgrade the proxy implementation and somehow finish the test of the endLottery

  async function deployContract() {
    const NFTLottery = await ethers.getContractFactory("NFTLottery");
    lotteryInstance = await upgrades.deployProxy(NFTLottery, [tokenName, tokenSymbol], { initializer: 'initialize(string,string)', unsafeAllow: ['constructor'] });
    await lotteryInstance.deployed();
  }
});
  