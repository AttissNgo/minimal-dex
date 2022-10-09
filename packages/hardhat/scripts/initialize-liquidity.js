const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const AMOUNT = ethers.utils.parseEther("5")

async function initializeLiquidity() {
    const noseToken = await ethers.getContract("NoseToken")
    const dex = await ethers.getContract("MinimalDex")
    
    console.log(`Approving ${AMOUNT} tokens...`)
    const approvalTx = await noseToken.approve(dex.address, AMOUNT)
    const approvalTxReceipt = await approvalTx.wait(1)
    console.log(`Approved contract ${approvalTxReceipt.events[0].args[1]} 
        to spend ${approvalTxReceipt.events[0].args[2].toString()} tokens.`)
    console.log('------------------------------------')
    console.log(`Initializing DEX...`)
    const initializeTx = await dex.initializeLiquidity(
                AMOUNT,
                { value: AMOUNT }
    ) 
    const initializeTxReceipt = await initializeTx.wait(1)
    if(initializeTxReceipt) {
        console.log('Dex initialized')
    }
    const liquidity = await dex.getTotalLiquidity()
    console.log(`Total liquidity is now ${liquidity}`)


    if (network.config.chainId == 31337) {
        // Moralis has a hard time if you move more than 1 block!
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

initializeLiquidity()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })