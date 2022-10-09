const {
    frontEndContractsFile,
    frontEndAbiLocation,
} = require("../helper-hardhat-config")
require("dotenv").config()
const fs = require("fs")
const { network, ethers } = require("hardhat")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        console.log("Contract addresses updated!")
        await updateAbi()
        console.log(`Contract ABIs written!`)
        // console.log("Front end written!")
    }
}

async function updateAbi() {
    const noseToken = await ethers.getContract("NoseToken")
    fs.writeFileSync(
        `${frontEndAbiLocation}NoseToken.json`,
        noseToken.interface.format(ethers.utils.FormatTypes.json)
    )

    const minimalDex = await ethers.getContract("MinimalDex")
    fs.writeFileSync(
        `${frontEndAbiLocation}MinimalDex.json`,
        minimalDex.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddresses() {
    const chainId = network.config.chainId.toString()
    const minimalDex = await ethers.getContract("MinimalDex")
    const noseToken = await ethers.getContract("NoseToken")
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["MinimalDex"].includes(minimalDex.address)) {
            contractAddresses[chainId]["MinimalDex"].push(minimalDex.address)
        } 
        else if (!contractAddresses[chainId]["NoseToken"].includes(noseToken.address)) {
            contractAddresses[chainId]["NoseToken"].push(noseToken.address)
        }
    } else {
        contractAddresses[chainId] = { MinimalDex: [minimalDex.address], NoseToken: [noseToken.address] }
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
