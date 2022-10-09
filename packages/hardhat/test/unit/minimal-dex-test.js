const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("MinimalDEX Unit Tests", function () {
        let dex, dexContract, dexUser1, noseToken, deployer, user1, ethAmount

        beforeEach(async () => {
            accounts = await ethers.getSigners()
            deployer = accounts[0]
            user1 = accounts[1]
            await deployments.fixture(["nosetoken"])
            noseToken = await ethers.getContract("NoseToken")
            const DEXContract = await ethers.getContractFactory(
                "MinimalDex",
                deployer
            )
            dex = await DEXContract.deploy(noseToken.address)

            ethAmount = ethers.utils.parseEther("5")
            await noseToken.approve(dex.address, ethers.utils.parseEther("5"))
            await dex.initializeLiquidity(
                ethers.utils.parseEther("5"),
                { value: ethAmount }
            )  
            
            // dexContract = await ethers.getContract("dex")
            // dexUser1 = dexContract.connect(user1)
            dexUser1 = dex.connect(user1)
        })

        describe("Initial liquidity", () => {
            it("Sets the initial liquidity", async function () {              
                const liquidity = await dex.getTotalLiquidity()
                assert.equal(liquidity.toString(), ethAmount.toString())
            })
            it("Reverts if DEX already has liquidity", async function () {
                await noseToken.approve(dex.address, ethers.utils.parseEther("1"))
                await expect(
                    dex.initializeLiquidity(
                        ethers.utils.parseEther("1"),
                        { value: ethers.utils.parseEther("1") }
                    )
                ).to.be.revertedWith("MinimalDex__alreadyHasLiquidity")
            })
        })

        describe("Calculating Price", () => {
            it("calculatePrice()", async function () {
                const expectedOutput = 453305
                const calculatedOutput = await dex.calculatePrice(100000, 1000000, 5000000)
                assert.equal(expectedOutput, calculatedOutput.toString())
            })
        })

        describe("Trading", () => {
            it("ethToToken()", async function () {
                const ethInput = ethers.utils.parseEther("0.5")
                const initialTokenBalance = await noseToken.balanceOf(user1.address)
                assert.equal(initialTokenBalance.toString(), 0)
                const expectedTokenOutput = await dex.calculatePrice(
                    ethInput,
                    ethAmount,
                    ethers.utils.parseEther("5")    
                )
                await dexUser1.ethToToken({ value: ethInput, from: user1.address })
                const tokenBalanceAfterSwap = await noseToken.balanceOf(user1.address)
                assert.equal(
                    expectedTokenOutput.toString(),
                    tokenBalanceAfterSwap.toString()
                )
            })
            it("tokenToEth()", async function () {
                const tokenInput = ethers.utils.parseEther("0.5")
                await noseToken.approve(dex.address, tokenInput)
                const expectedEthOutput = await dex.calculatePrice(
                    tokenInput,
                    ethAmount,
                    ethers.utils.parseEther("5")
                )
                const tx = await dex.tokenToEth(tokenInput)
                const receipt = await tx.wait()
                const ethOutput = receipt.events[2].args.ethOutput
                assert.equal(
                    expectedEthOutput.toString(),
                    ethOutput.toString()
                )
            })
            it("Reverts for insufficient token balance", async function () {
                await expect(dexUser1.tokenToEth(1))
                    .to.be.revertedWith("MinimalDex__userTokenBalanceInsufficient")
            })
        })

        describe("Adding liquidity", () => {           
            beforeEach(async () => {
                await noseToken.approve(dex.address, ethers.utils.parseEther("10"))
            })
            it("Calculates token deposit based on ETH value sent to addLiquidity()", async function () {
                // const ETHbalance  = await dex.provider.getBalance(dex.address)
                // console.log(ETHbalance.toString())
                // const NOSEbalance = await noseToken.balanceOf(dex.address)
                // console.log(NOSEbalance.toString())
                const ethDeposit = ethers.utils.parseEther("1")
                const expectedTokenDeposit = ethDeposit.add(1)
                const tx = await dex.addLiquidity({ value: ethDeposit })
                const receipt = await tx.wait(1)
                const tokenDeposit = receipt.events[2].args[3]
                // console.log(receipt.events[2].args[3].toString())
                assert.equal(
                    expectedTokenDeposit.toString(),
                    tokenDeposit.toString()
                )
            })
            it("Adds liquidity to DEX", async function () {
                const ethDeposit = ethers.utils.parseEther("2")
                const liquidityBeforeDeposit = await dex.getTotalLiquidity()
                const tx = await dex.addLiquidity({ value: ethDeposit })
                const receipt = await tx.wait(1)
                const liquidityAdded = receipt.events[2].args[1]
                const expectedLiquidityAfterDeposit = liquidityBeforeDeposit.add(liquidityAdded)
                const liquidityAfterDeposit = await dex.getTotalLiquidity()
                assert.equal(
                    expectedLiquidityAfterDeposit.toString(),
                    liquidityAfterDeposit.toString()
                )
            })
            it("Mints liquidity to user", async function () {
                const ethDeposit = ethers.utils.parseEther("3")
                const userLiquidityBeforeDeposit = await dex.getUserLiquidity(deployer.address)
                const tx = await dex.addLiquidity({ value: ethDeposit })
                const receipt = await tx.wait(1)
                const liquidityMinted = receipt.events[2].args[1]
                const expectedUserLiquidityAfterDeposit = userLiquidityBeforeDeposit.add(liquidityMinted)
                const userLiquidityAfterDeposit = await dex.getUserLiquidity(deployer.address)
                assert.equal(
                    expectedUserLiquidityAfterDeposit.toString(),
                    userLiquidityAfterDeposit.toString()
                )
            })
            it("Reverts if user doesn't have enough tokens", async function () {
                await expect(dexUser1.addLiquidity({ value: 1}))
                    .to.be.revertedWith("MinimalDex__userTokenBalanceInsufficient")
            })
        })

        describe("Withdrawing liquidity", () => {
            it("Calculates ETH amount to be sent to user when withdrawing liquidity", async function () {
                const withdrawAmount = ethers.utils.parseEther("2")
                const totalLiquidity = await dex.getTotalLiquidity()
                const ethReserve = await dex.provider.getBalance(dex.address)
                const expectedEthWithdraw = (withdrawAmount.mul(ethReserve)).div(totalLiquidity)
                const tx = await dex.withdrawLiquidity(withdrawAmount)
                const receipt = await tx.wait(1)
                const ethWithdraw = receipt.events[1].args[2]
                assert.equal(
                    expectedEthWithdraw.toString(),
                    ethWithdraw.toString()
                )
                const ethReserveAfterWithdraw = await dex.provider.getBalance(dex.address)
                assert.equal(
                    ethReserveAfterWithdraw.toString(),
                    (ethReserve.sub(ethWithdraw)).toString()
                )
            })
            it("Calculates token amount to be sent to user when withdrawing liquidity", async function () {
                const withdrawAmount = ethers.utils.parseEther("3")
                const totalLiquidity = await dex.getTotalLiquidity()
                const tokenReserve = await noseToken.balanceOf(dex.address)
                const expectedTokenWithdraw = (withdrawAmount.mul(tokenReserve)).div(totalLiquidity)
                const tx = await dex.withdrawLiquidity(withdrawAmount)
                const receipt = await tx.wait(1)
                const tokenWithdraw = receipt.events[1].args[3]
                assert.equal(
                    expectedTokenWithdraw.toString(),
                    tokenWithdraw.toString()
                )
                const tokenReserveAfterWithdraw = await noseToken.balanceOf(dex.address)
                assert.equal(
                    tokenReserveAfterWithdraw.toString(),
                    (tokenReserve.sub(tokenWithdraw)).toString()
                )
            })
            it("Removes liquidity from pool and from user mapping", async function () {
                const withdrawAmount = ethers.utils.parseEther("3")
                const totalLiquidityBeforeWithdraw = await dex.getTotalLiquidity()
                const userLiquidityBeforeWithdraw = await dex.getUserLiquidity(deployer.address)
                await dex.withdrawLiquidity(withdrawAmount)
                const totalLiquidityAfterWithdraw = await dex.getTotalLiquidity()
                const userLiquidityAfterWithdraw = await dex.getUserLiquidity(deployer.address)
                assert.equal(
                    totalLiquidityAfterWithdraw.toString(),
                    (totalLiquidityBeforeWithdraw.sub(withdrawAmount)).toString()
                )
                assert.equal(
                    userLiquidityAfterWithdraw.toString(),
                    (userLiquidityBeforeWithdraw.sub(withdrawAmount)).toString()
                )
            })
            it("Reverts for insufficient user liquidity", async function () {
                const withdrawAmount = ethers.utils.parseEther("6")
                await expect(dex.withdrawLiquidity(withdrawAmount))
                    .to.be.revertedWith("MinimalDex__insufficientUserLiquidity")
            })
        })
    })