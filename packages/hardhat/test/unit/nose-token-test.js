const { assert } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NoseToken Unit Tests", function () {
        let noseToken, deployer

        beforeEach(async () => {
            accounts = await ethers.getSigners()
            deployer = accounts[0]
            
            const NoseTokenContract = await ethers.getContractFactory(
                "NoseToken",
                deployer
            )
            noseToken = await NoseTokenContract.deploy()
                //or.... can use this pattern for deployement if we want to use the deploy scripts:
            // await deployments.fixture(["nosetoken"])
            // noseToken = await ethers.getContract("NoseToken")
            
        })

        describe("Constructor", () => {
            it("Sets the name", async function () {
                const tokenName = "NoseToken"
                const name = await noseToken.name()
                assert.equal(tokenName, name)
            })
            it("Sets the symbol", async function () {
                const tokenSymbol = "NOSE"
                const symbol = await noseToken.symbol()
                assert.equal(tokenSymbol, symbol)
            })
            it("Mints 1000 tokens and transfers them to deployer address", async function () {
                const deployerBalance = await noseToken.balanceOf(deployer.address)
                assert.equal(ethers.utils.formatEther(deployerBalance), 1000)
            })
        })
    })