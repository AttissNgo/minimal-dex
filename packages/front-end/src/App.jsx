import { useEffect, useState } from "react"
import { ConnectButton } from '@web3uikit/web3'
import { ethers } from 'ethers'
import { NETWORKS } from "./constants/networks"
import { useMoralis } from "react-moralis"
import { 
    Container, 
    Flex, 
    Heading, 
    Text, 
    useBreakpointValue, 
    useColorModeValue, 
    useToast,
    VStack 
} from "@chakra-ui/react"

import tokenAbi from './constants/NoseToken.json'
import dexAbi from './constants/MinimalDex.json'
import networkMapping from './constants/networkMapping.json'

import NotAuthenticated from "./components/NotAuthenticated"
import DarkModeButton from "./components/DarkModeButton"
import Swap from "./components/Swap"
import Liquidity from "./components/Liquidity"
import Graph from "./components/Graph"
import Trades from "./components/Trades"

function App() {
    var console = require("console-browserify")

    const { account, isWeb3Enabled, chainId } = useMoralis()

    const [userTokenBalance, setUserTokenBalance] = useState('0')
    const [ethReserve, setEthReserve] = useState('0')
    const [tokenReserve, setTokenReserve] = useState('0')
    const [totalLiquidity, setTotalLiquidity] = useState('0')
    const [userLiquidity, setUserLiquidity] = useState('0')
    const [addingEth, setAddingEth] = useState('0')
    const [addingToken, setAddingToken] = useState('0') 
    const [swapType, setSwapType] = useState('ethToNose')
    const [calculatedOutput, setCalculatedOutput] = useState('0')
    const [ethToToken, setEthToToken] = useState([])
    const [tokenToEth, setTokenToEth] = useState([])

    const toast = useToast()

    function closeToast() {
        toast.closeAll()
    }

    const txInProgressToast = () => {
        toast({
            title: 'Transaction in progress',
            description: 'Please wait...',
            status: 'loading',
            duration: null,
            isClosable: true,
        })
    }

    const approvalInProgressToast = () => {
        toast({
            title: 'Approval in progress',
            description: 'Please wait...',
            status: 'loading',
            duration: null,
            isClosable: true,
        })
    }

    const targetNetwork = NETWORKS.goerli 
    const provider = new ethers.providers.JsonRpcProvider(targetNetwork.rpcUrl)
    const tokenAddress = networkMapping[targetNetwork.chainId].NoseToken[0]
    const dexAddress = networkMapping[targetNetwork.chainId].MinimalDex[0]
    const token = new ethers.Contract(tokenAddress, tokenAbi, provider)
    const dex = new ethers.Contract(dexAddress, dexAbi, provider)

    const getEthToTokenEvents = async () => {
        const ethToTokenEvents = await dex.queryFilter("SwapEthForToken")
        setEthToToken(ethToTokenEvents)
    }

    const getTokenToEthEvents = async () => {
        const tokenToEthEvents = await dex.queryFilter("SwapTokenForEth")
        setTokenToEth(tokenToEthEvents)
    }


    const handleAddEth = (num) => {
        setAddingEth(num)
    }
    const handleAddToken = (num) => {
        setAddingToken(num) 
    }
    const handleSwapType = (type) => {
        setSwapType(type)
    }

    const fetchUserTokenBalance = async () => {
        if(isWeb3Enabled && account) {
            const balance = await token.balanceOf(account)
            setUserTokenBalance(ethers.utils.formatEther(balance).toString())
        }
    }

    const fetchReserves = async () => {
        const ethBalance = await provider.getBalance(dexAddress)
        const tokenBalance = await token.balanceOf(dexAddress)
        setEthReserve(ethers.utils.formatEther(ethBalance))
        setTokenReserve(ethers.utils.formatEther(tokenBalance))
    }

    const fetchTotalLiquidity = async () => {
        const liquidity = await dex.getTotalLiquidity()
        setTotalLiquidity(ethers.utils.formatEther(liquidity))
    }

    const fetchUserLiquidity = async () => {
        const liquidity = await dex.getUserLiquidity(account)
        setUserLiquidity(ethers.utils.formatEther(liquidity))
    }

    const calculateOutput = () => {
        let xInput, xReserves, yReserves
        if(swapType === 'ethToNose') {
            xInput = addingEth
            xReserves = ethReserve
            yReserves = tokenReserve
        } else if(swapType === 'noseToEth') {
            xInput = addingToken
            xReserves = tokenReserve
            yReserves = ethReserve
        } 
        const xInputPlusFee = xInput * 997
        const numerator = xInputPlusFee * yReserves
        const denominator = (xReserves * 1000) + xInputPlusFee
        const output = numerator / denominator
        setCalculatedOutput(output.toString())      
    }

    const handleSwapSuccess = (receipt) => {
        console.log('Swap successful', receipt)
        closeToast()
        toast({
            title: 'Exchange Successful',
            description: 'Your swap was successful',
            status: 'success',
            duration: 5000,
            isClosable: true,
        })
        fetchUserTokenBalance()
        fetchReserves()
    }

    const handleDepositSuccess = (receipt) => {
        console.log('Liquidity deposited', receipt)
        closeToast()
        toast({
            title: 'Liquidity Deposited',
            description: 'Your deposit was successful',
            status: 'success',
            duration: 5000,
            isClosable: true,
        })
        fetchUserTokenBalance()
        fetchTotalLiquidity()
        fetchUserLiquidity()
        fetchReserves()
    }

    const handleWithdrawSuccess = (receipt) => {
        console.log('Liquidity withdrawn', receipt)
        closeToast()
        toast({
            title: 'Liquidity Withdrawn',
            description: 'Your withdrawal was successful',
            status: 'success',
            duration: 5000,
            isClosable: true,
        })
        fetchUserTokenBalance()
        fetchTotalLiquidity()
        fetchUserLiquidity()
        fetchReserves()
    }

    const handleApprovalSuccess = (receipt, amount) => {
        console.log(receipt)
        closeToast()
        toast({
            title: 'Tokens Approved',
            description: `Approved ${parseFloat(ethers.utils.formatEther(amount)).toFixed(4)} tokens`,
            status: 'success',
            duration: 5000,
            isClosable: true,
        })
    }

    useEffect(() => {
        calculateOutput()
    }, [addingEth, addingToken, swapType])

    useEffect(() => {
        fetchUserTokenBalance()
        fetchReserves()
    }, [account, isWeb3Enabled])

    useEffect(() => {
        fetchTotalLiquidity()
    }, [ethReserve, tokenReserve])

    useEffect(() => {
        fetchUserLiquidity()
    }, [ethReserve, tokenReserve, account])

    useEffect(() => {
        getEthToTokenEvents()
        getTokenToEthEvents() 
    }, [])

    useEffect(() => {
        dex.on("SwapEthForToken", fetchUserTokenBalance)
        dex.on("SwapEthForToken", fetchReserves)
        dex.on("SwapEthForToken", getEthToTokenEvents)
        return () => {
            dex.removeAllListeners("SwapEthForToken")
        }
    }, [])

    useEffect(() => {
        dex.on("SwapTokenForEth", fetchUserTokenBalance)
        dex.on("SwapTokenForEth", fetchReserves)
        dex.on("SwapTokenForEth", getTokenToEthEvents)
        return () => {
            dex.removeAllListeners("SwapTokenForEth")
        }
    }, [])
    
    useEffect(() => {
        dex.on("LiquidityProvided", fetchTotalLiquidity)
        dex.on("LiquidityProvided", fetchReserves)
        return () => {
            dex.removeAllListeners("LiquidityProvided")
        }
    }, [])

    const baseGradient = useColorModeValue(
        'linear(to-r, mustard.300, mustard.100)', 
        'linear(to-r, violet.ultradark, violet.dark)')
    const mdGradient = useColorModeValue(
        'linear(to-r, mustard.300, mustard.100, teal.100)', 
        'linear(to-r, violet.ultradark, teal.dark)')
    const infoPanelBg = useColorModeValue('linear(to-b, mustard.200, mustard.100)', 
        'linear(to-b, teal.ultradark, teal.dark)')
    const title = useBreakpointValue({
        base: '👃 NOSE TOKEN EXCHANGE 👃',
        md: '👃👃👃 NOSE TOKEN EXCHANGE 👃👃👃'
    })

    return (
        <Container minH='100vh' maxW='100vw' bgGradient={{base: baseGradient, md: mdGradient}}>
            <Flex p={4}
                direction='row' 
                justifyContent={{ base: 'center', md: 'flex-end' }}
            >
                <ConnectButton />
            </Flex>

            <Container maxW='100vw' pt={4} centerContent>
                <Heading size='lg'>{title}</Heading>
                { account && chainId === targetNetwork.chainHex ?
                    <Flex pt={5}
                    direction={{ base: 'column', md: 'row'}}
                    justifyContent='center'
                    alignItems='center'
                    >
                        <VStack 
                            h='75vh' 
                            w={{ base: '90vw' ,md: '45vw'}} 
                            justifyContent='center'    
                        >      
                            <VStack p={8}
                                h='70vh' 
                                w={{ base: '85vw' ,md: '40vw'}}
                                bgGradient={infoPanelBg}
                                boxShadow='md'
                                alignItems='flex-start'
                                spacing={12}
                                overflow='auto'
                            >
                                <Text fontSize='xl' as='b'>
                                    Token Balance: {parseFloat(userTokenBalance).toFixed(3)} 👃
                                </Text>
                                <Swap
                                    handleAddEth={handleAddEth}
                                    handleAddToken={handleAddToken}
                                    handleSwapType={handleSwapType}
                                    swapType={swapType}
                                    calculatedOutput={calculatedOutput}
                                    txInProgressToast={txInProgressToast}
                                    addingEth={addingEth}
                                    addingToken={addingToken}
                                    dexAddress={dexAddress}
                                    tokenAddress={tokenAddress}
                                    handleSwapSuccess={handleSwapSuccess}
                                    approvalInProgressToast={approvalInProgressToast}
                                    handleApprovalSuccess={handleApprovalSuccess}
                                />
                                <Graph 
                                    dex={dex}
                                    calculatedOutput={calculatedOutput}
                                    ethReserve={ethReserve}
                                    tokenReserve={tokenReserve}
                                    swapType={swapType}
                                    addingEth={addingEth}
                                    addingToken={addingToken}
                                />
                            </VStack>
                        </VStack>
                        <VStack 
                            h='75vh' 
                            w={{ base: '90vw' ,md: '45vw'}} 
                            justifyContent='center'
                        >      
                            <VStack p={8}
                                h='70vh' 
                                w={{ base: '85vw' ,md: '40vw'}}
                                bgGradient={infoPanelBg}
                                boxShadow='md'
                                alignItems='flex-start'
                                spacing={8}
                                overflow='auto'
                            >
                                <Liquidity 
                                    totalLiquidity={totalLiquidity}
                                    userLiquidity={userLiquidity}
                                    ethReserve={ethReserve}
                                    tokenReserve={tokenReserve}
                                    tokenAddress={tokenAddress}
                                    dexAddress={dexAddress}
                                    txInProgressToast={txInProgressToast}
                                    handleDepositSuccess={handleDepositSuccess}
                                    handleWithdrawSuccess={handleWithdrawSuccess}
                                    approvalInProgressToast={approvalInProgressToast}
                                    handleApprovalSuccess={handleApprovalSuccess}
                                />
                                <Trades 
                                    ethToToken={ethToToken}
                                    tokenToEth={tokenToEth}
                                />
                            </VStack>
                        </VStack>
                    </Flex>
                    : <NotAuthenticated />
                }
            </Container>
            <Flex as='footer'
                className='Footer'
                position='fixed'
                left='0'
                bottom='0'
                zIndex='200'
                w='full'
                h={{ base: 'auto', md: '5vh'}} 
                px={4}
                alignItems='center'
                justifyContent='flex-end'
            >
                <DarkModeButton />
            </Flex>
        </Container>
    )
}

export default App;
