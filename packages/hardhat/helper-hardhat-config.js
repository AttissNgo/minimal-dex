const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
    },
    4: {
        name: "rinkeby",
    },
    5: {
        name: "goerli",
    },
    1: {
        name: "mainnet",
        keepersUpdateInterval: "30",
    },
}

const DECIMALS = "18"
const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
// const frontEndContractsFile = "../front-end/constants/networkMapping.json"
// const frontEndAbiLocation = "../front-end/constants/"
const frontEndContractsFile = "../front-end/src/constants/networkMapping.json"
const frontEndAbiLocation = "../front-end/src/constants/"

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    frontEndContractsFile,
    frontEndAbiLocation,
}