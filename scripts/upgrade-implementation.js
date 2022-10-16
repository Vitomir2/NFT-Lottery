const verifyContract = require("./verify-contract");

async function upgradeImplementation() {
    const proxyAddress = "0xb451034E042B3230A1b91FeDFd538903C281368c";

    await hre.run('compile'); // We are compiling the contracts using subtask
    const [owner] = await ethers.getSigners(); // We are getting the owner

    const NFTLotteryV2 = await ethers.getContractFactory("NFTLotteryV2", owner);
    const NFTLotteryInstance = await upgrades.upgradeProxy(proxyAddress, NFTLotteryV2);
    const receipt = await NFTLotteryInstance.deployed();
    await receipt.wait(5);

    let implementationAddress = await upgrades.erc1967.getImplementationAddress(NFTLotteryInstance.address);
    console.log("The new implementation address: ", implementationAddress);

    await verifyContract(implementationAddress);

    console.log("Done!");
}

upgradeImplementation().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});