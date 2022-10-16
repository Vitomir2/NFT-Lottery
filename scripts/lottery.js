// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const verifyContract = require("./verify-contract");
const ethers = hre.ethers;
const upgrades = hre.upgrades;

const tokenName = "LotteryTicket";
const tokenSymbol = "LT";

async function deployLotteryContract() {
  await hre.run('compile'); // We are compiling the contracts using subtask
  const [deployer] = await ethers.getSigners(); // We are getting the deployer

  console.log('Deploying contracts with the account:', deployer.address); // We are printing the address of the deployer
  console.log('Account balance:', (await deployer.getBalance()).toString()); // We are printing the account balance

  const NFTLottery = await ethers.getContractFactory("NFTLottery");
  const NFTLotteryInstance = await upgrades.deployProxy(NFTLottery, [tokenName, tokenSymbol], { initializer: 'initialize(string,string)' });
  console.log('Waiting for NFTLottery deployment...');
  await NFTLotteryInstance.deployed();
  
  console.log('NFTLottery Proxy Contract address: ', NFTLotteryInstance.address);
  let implementationAddress = await upgrades.erc1967.getImplementationAddress(NFTLotteryInstance.address);
  console.log('Implementation address: ' + implementationAddress);

  await upgrades.admin.changeProxyAdmin(NFTLotteryInstance.address, deployer.address);
  console.log('Proxy admin address: ' + await upgrades.erc1967.getAdminAddress(NFTLotteryInstance.address));

  await verifyContract(implementationAddress);

  console.log('Done!');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deployLotteryContract().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});