async function verifyContract(address) {
    // Verify implementation on etherscan
    if (address) {
      console.log(`Attempting to verify implementation contract with etherscan: ${address}`);
      try {
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: [],
        });
      } catch (e) {
        console.log(`Failed to verify contract: ${e}`);
      }
    }
}

module.exports = verifyContract;