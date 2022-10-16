const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const context = describe;

describe("NFTLottery", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  let accounts;

  const tokenName = "LotteryTicket";
  const tokenSymbol = "LT";
  let lotteryInstance;

  const initialTicketPrice = ethers.utils.parseEther("0.1");
  const newTicketPrice = ethers.utils.parseEther("0.5");
  const lotteryDuration = 60; // seconds

  before(async function() {
    accounts = await ethers.getSigners();
    lotteryInstance = await deployContract(accounts[0]);
  });

  context("Before the lottery has started", function() {
    describe("Initialize", function() {
      it("should deploy the lottery ticket NFT contract successfully", async function() {
        expect(await lotteryInstance.connect(accounts[1].address).name()).to.equal(tokenName);
        expect(await lotteryInstance.connect(accounts[1].address).symbol()).to.equal(tokenSymbol);
        expect(await lotteryInstance.connect(accounts[1].address).ticketPrice()).to.equal(initialTicketPrice);
      });
    });
  
    //todo probably create separate file with object type structured revert messages, if there is time
    describe("Reverts before the lottery has started", function() {
      const lotteryNotOpenErr = "NFTLottery: The lottery is not open";
      let defaultAdminRole;
      let accessControlError;
  
      before(async function() {
        const accountOneAddressLC = accounts[1].address.toLowerCase();
        defaultAdminRole = await lotteryInstance.connect(accounts[1].address).DEFAULT_ADMIN_ROLE();
        accessControlError = `AccessControl: account ${accountOneAddressLC} is missing role ${defaultAdminRole}`;
      });
      
      it("should fail to enter the lottery when it is still not open", async function() {
        await expect(lotteryInstance.connect(accounts[0])
          .enterLottery({ value: initialTicketPrice })
        ).to.be.revertedWith(lotteryNotOpenErr);
      });
  
      it("should fail to award a surprise winner when the lottery is still not open", async function() {
        await expect(lotteryInstance.connect(accounts[0])
          .awardSurpriseWinner()
        ).to.be.revertedWith(lotteryNotOpenErr);
      });
  
      it("should fail when non-owner user try change the ticket price", async function() {
        await expect(lotteryInstance.connect(accounts[1])
          .setTicketPrice(initialTicketPrice)
        ).to.be.revertedWith(accessControlError);
      });
  
      it("should fail when the owner try to set 0 ETH ticket price", async function() {
        await expect(lotteryInstance.connect(accounts[0])
          .setTicketPrice(0)
        ).to.be.revertedWith("NFTLottery: _price == 0");
      });
  
      it("should fail when non-owner user try to start the lottery", async function() {
        await expect(lotteryInstance.connect(accounts[1])
          .startLottery(0, 0)
        ).to.be.revertedWith(accessControlError);
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

    describe("Successfully set state variables", async function() {
      it("should set new ticket price", async function() {
        await lotteryInstance.connect(accounts[0]).setTicketPrice(newTicketPrice);
        expect(await lotteryInstance.ticketPrice()).to.equal(newTicketPrice);
      });
    });
  });

  context("After the lottery has started", function() {
    let startAt;
    let endAt;

    before(async function() {
      startAt = Math.floor(Date.now() / 1000) - 10; //* exclude 10 seconds to ensure it has started
      endAt = startAt + lotteryDuration;

      await lotteryInstance.connect(accounts[0]).startLottery(ethers.BigNumber.from(startAt), ethers.BigNumber.from(endAt));
    });

    describe("Reverts after the lottery has started", async function() {
      it("should start the lottery successfully", async function() {
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
  
    describe("Successfully start and finish the lottery", async function() {
      let fundsToGatherBigNum = newTicketPrice.mul(ethers.BigNumber.from(5));
  
      it("should enter the lottery with 5 accounts", async function() {
        await lotteryInstance.connect(accounts[0]).enterLottery({ value: newTicketPrice });
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
        expect(await lotteryInstance.surpriseWinner()).to.not.equal(ethers.constants.AddressZero);
      });
  
      it("should wait the lottery to end and distribute the left balance to another random winner", function(done) {
        //* To calculate the left time, exclude approximately 15 secs, because of the passed execution,
        //* and multiply by thousand to convert to ms
        const estimatedTimeoutLeft = (lotteryDuration - 15) * 1000;
        setTimeout(async function() {
          await lotteryInstance.endLottery();
          expect(await lotteryInstance.getETHBalance()).to.equal(ethers.BigNumber.from(0));
          expect(await lotteryInstance.lotteryWinner()).to.not.equal(ethers.constants.AddressZero);
          done();
        }, estimatedTimeoutLeft);
      });
    });
  });

  describe("Upgradeability features tests", async function() {
    it("should throw on trying to upgrade the implementation from non-owner user", async function () {
      const NFTLotteryV2 = await ethers.getContractFactory("NFTLotteryV2", accounts[1]); //todo test for repeats and improve
      await expect(upgrades.upgradeProxy(lotteryInstance.address, NFTLotteryV2)).to.be.revertedWith("Ownable: caller is not the owner"); //todo test revert message repeats and improve
    });

    it("should change the proxy admin successfully", async function() {
      await upgrades.admin.changeProxyAdmin(lotteryInstance.address, accounts[1].address);
      expect(await upgrades.erc1967.getAdminAddress(lotteryInstance.address)).to.equal(accounts[1].address);
    });

    it("should throw when call the implementation with the admin", async function() {
      await expect(lotteryInstance.connect(accounts[1]).name()).to.be.revertedWith("TransparentUpgradeableProxy: admin cannot fallback to proxy target");
    });

    it("should upgrade the implementation successfully with the admin", async function() {
      const oldImplementationAddress = await upgrades.erc1967.getImplementationAddress(lotteryInstance.address);

      const NFTLotteryV2 = await ethers.getContractFactory("NFTLotteryV2", accounts[1]);
      lotteryInstance = await upgrades.upgradeProxy(lotteryInstance.address, NFTLotteryV2);
      await lotteryInstance.deployed();

      const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(lotteryInstance.address);

      expect(newImplementationAddress).to.not.equal(oldImplementationAddress);
      expect(await lotteryInstance.connect(accounts[0]).getVersion()).to.equal(ethers.BigNumber.from(2));
    });
  });

  async function deployContract(signer) {
    const NFTLottery = await ethers.getContractFactory("NFTLottery", signer);
    const _lotteryInstance = await upgrades.deployProxy(
      NFTLottery,
      [tokenName, tokenSymbol],
      { initializer: 'initialize(string,string)' }
    );
    await _lotteryInstance.deployed();

    return _lotteryInstance;
  }
});
  