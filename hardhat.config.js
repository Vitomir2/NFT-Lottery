require("dotenv").config();

require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");

/**
 * @notice Private keys for the deployment configuration.
 * @dev Setting the .env file.
 */
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ? process.env.DEPLOYER_PRIVATE_KEY : "";
const ETH_TESTNET_KEY = process.env.ETH_TESTNET_KEY ? process.env.ETH_TESTNET_KEY : "";
const ETH_TESTNET_URL = process.env.ETH_TESTNET_URL ? process.env.ETH_TESTNET_URL + ETH_TESTNET_KEY : "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ? process.env.ETHERSCAN_API_KEY : "";
const POLYGON_TESTNET_KEY = process.env.POLYGON_TESTNET_KEY ? process.env.POLYGON_TESTNET_KEY : "";
const POLYGON_TESTNET_URL = process.env.POLYGON_TESTNET_URL ? process.env.POLYGON_TESTNET_URL + POLYGON_TESTNET_KEY : "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY ? process.env.POLYGONSCAN_API_KEY : "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          outputSelection: {
            "*": {
              "*": ["storageLayout"]
            }
          }
        }
      }
    ]
  },
  defaultNetwork: "hardhat",
  networks: {
    // Ethereum
    goerli: {
      url: ETH_TESTNET_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? DEPLOYER_PRIVATE_KEY : []
    },
    // Polygon
    mumbai: {
      url: POLYGON_TESTNET_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? DEPLOYER_PRIVATE_KEY : []
    }
  },
  etherscan: {
    apiKey: {
      // Ethereum
      goerli: ETHERSCAN_API_KEY,
      // Polygon
      polygonMumbai: POLYGONSCAN_API_KEY
    }
  },
  mocha: {
    timeout: 100000000000000
  }
};
