# NFT Lottery contract

NFT Lottery assignment. ***For test and development purposes only

## Prerequisites

For development purposes, you will need `Node.js` (>= v14) and a package manager – `npm` (>= 6). For the development, the following versions were used:
-   `Node.js` — v16.17.0
-   `npm` — 8.15.0

## Installation

Run the command `$ npm install` to install all the dependencies specified in `package.json`, compile contracts and run tests.

## Configuration

#### `hardhat.config.js`
The file contains configuration related to connection to the blockchain. For more information – read [the Hardhat docs](https://hardhat.org/config/).
-   `solidity`. This section specifies versions of the compilers, and here is used to set the version of _solc_ Solidity compiler to _0.8.17_.
-   `defaultNetwork`. You can customize which network is used by default when running Hardhat by setting the config's `defaultNetwork` field. If you omit this config, its default value is `"hardhat"`.
-   `networks`. Each of the networks subentry corresponds to the Hardhat _--network_ parameter.
-   `etherscan`. Configuration of [_@nomiclabs/hardhat-etherscan_](https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html) plugin that helps verify the source code for smart-contracts on [Etherscan](https://etherscan.io/), [Polygonscan](https://polygonscan.com/), etc.
-   `mocha`. Configuring the mocha settings, in our case the `timeout` is increased.

#### `.env`
**!!! Needed to be created manually!!!**

For the deployment process to be successfully performed, the `.env` file with filled-in parameters should be present at the root of the project. In the same place, you should find a file `.env.example`. It contains all of the parameters that must be present in the `.env` file but without actual values (only parameter names).

For now, `hardhat.config.js` uses the following:
-   `ETH_TESTNET_KEY` and `POLYGON_TESTNET_KEY`. Private keys for the test networks. The contracts are deployed from an account (obtained from the private key that corresponds to the selected network) that should have **enough funds** to be able to deploy the contracts. You should set only those private keys that are planned to be used.
-   `ETH_TESTNET_URL` and `POLYGON_TESTNET_URL`. The project does not use an own ethereum node thus external providers can be used. For example, [Alchemy](https://www.alchemyapi.io/). To obtain the URLs with API keys you shall their visit websites.
-   `ETHERSCAN_API_KEY`, `POLYGONSCAN_API_KEY`. The API keys of [Etherscan](https://etherscan.io/), [Polygonscan](https://polygonscan.com/) for plugin [_@nomiclabs/hardhat-etherscan_](https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html).
-   `DEPLOYER_PRIVATE_KEY`. The private of the deployer wallet.

## Running scripts

## _Development_

### Testing

You can perform tests with `$ npx hardhat test` to run all tests from the `test/` directory.

### Utilities

`$ npm run dev:size-contracts` to output compiled contract sizes.<br>
`$ npm run dev:abi` to generate abi to the directory `abi/`.
`$ npm run docgen` to generate a documentation for smart-contracts. The documentation is generated for all smart-contracts (from the directory `contracts/`) to the directory `docs/` using the [NatSpec format](https://docs.soliditylang.org/en/v0.8.7/natspec-format.html). There is a template and helpers in the directory `docgen/`. This uses the documentation generator libraries by OpenZeppelin ([solidity-docgen](https://github.com/OpenZeppelin/solidity-docgen)).<br>
`$ npm run flatten` to flatten the smart-contracts before building. Use this if you need to verify contracts on your own. By default, all deployment scripts will verify code automatically (you will need to set the API keys and URLs for contract verification services, see [Configuration](#Configuration) section).

## _Production_

### Build

Use `$ npx hardhat compile` to compile the contracts code to use it some of the real networks (testnet/mainnet).

### Deploy

Before proceeding with the deployment process, make sure you have read a [Configuration](#Configuration) section and set up the `.env` file.

Use `$ npx hardhat run .\scripts\lottery.js --network <network-name>` to deploy the contract on the networks that are configured in the `hardhat.config.js`. In order to update the implementation, you can use `npx hardhat run .\scripts\update-implementation.js --network <network-name>`. Both scripts are going to verify the implementation contracts automatically.

For now, the following Ethereum networks are supported:
-   hardhat (development, default)
-   mumbai
-   goerli
