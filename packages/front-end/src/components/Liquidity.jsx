import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWeb3Contract } from 'react-moralis'
import { 
    Button, 
    FormControl, 
    FormLabel, 
    Heading, 
    HStack, 
    NumberInput, 
    NumberInputField, 
    Spacer, 
    Text, 
    useColorModeValue, 
    useToast,
    VStack 
} from '@chakra-ui/react'

import tokenAbi from '../constants/NoseToken.json'
import dexAbi from '../constants/MinimalDex.json'

export default function Liquidity({ 
    dexAddress,
    tokenAddress, 
    ethReserve, 
    tokenReserve, 
    totalLiquidity, 
    userLiquidity, 
    handleDepositSuccess,
    handleWithdrawSuccess,
    approvalInProgressToast,
    handleApprovalSuccess,
    txInProgressToast }) 
{
    var console = require("console-browserify")

    const { runContractFunction } = useWeb3Contract()

    const [depositAmount, setDepositAmount] = useState(0)
    const [tokenDepositAmount, setTokenDepositAmount] = useState(0)
    const [withdrawAmount, setWithdrawAmount] = useState(0)
    const [ethWithdraw, setEthWithdraw] = useState(0)
    const [tokenWithdraw, setTokenWithdraw] = useState(0)

    const toast = useToast()

    function closeToast() {
        toast.closeAll()
    }

    function handleApprovalError(error) {
        console.log(error)
        closeToast()
        toast({
            title: 'Approval error',
            description: 'Unable to approve tokens for deposit',
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    }

    function handleDepositError(error) {
        console.log(error)
        closeToast()
        toast({
            title: 'Deposit error',
            description: 'Unable to complete deposit',
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    }

    function handleWithdrawError(error) {
        console.log(error)
        closeToast()
        toast({
            title: 'Withdraw error',
            description: 'Unable to complete withdrawal',
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    }

    const calculateDeposit = () => {
        const tokenDeposit = (depositAmount * tokenReserve)/ethReserve
        setTokenDepositAmount(tokenDeposit)
    }

    const calculateWithdraw = () => {
        const ethAmount = (withdrawAmount * ethReserve)/totalLiquidity
        const tokenAmount = (withdrawAmount * tokenReserve)/totalLiquidity
        setEthWithdraw(ethAmount)
        setTokenWithdraw(tokenAmount)
    }

    const deposit = async () => {
        const oneWei = ethers.utils.parseUnits('1', "wei")
        const tokenAmount = ethers.utils.parseEther(depositAmount).add(oneWei)
        const ethAmount = ethers.utils.parseEther(depositAmount)
        const approveOptions = {
            abi: tokenAbi,
            contractAddress: tokenAddress,
            functionName: "approve",
            // gasLimit: 100000,
            params: {
                spender: dexAddress,
                amount: tokenAmount,
            },
        }
        const approvalTx = await runContractFunction({
            params: approveOptions,
            onSuccess: () => console.log(`Approved ${tokenAmount} tokens`),
        })
        approvalInProgressToast()
        let approvalReceipt
        try {
            approvalReceipt = await approvalTx.wait()
        } catch (error) {
            handleApprovalError(error)
        }
        if(approvalReceipt) {
            handleApprovalSuccess(approvalReceipt, tokenAmount)
        }
        const addLiquidityOptions = {
            abi: dexAbi,
            contractAddress: dexAddress,
            functionName: "addLiquidity",
            msgValue: ethAmount,
        }
        const addLiquidityTx = await runContractFunction({
            params: addLiquidityOptions,
        })
        txInProgressToast()
        let addLiquidityReceipt
        try {
            addLiquidityReceipt = await addLiquidityTx.wait()
        } catch (error) {
            handleDepositError(error)
        }
        if(addLiquidityReceipt) {
            handleDepositSuccess(addLiquidityReceipt)
        } 
        setDepositAmount(0)
    }

    const withdraw = async () => {
        const amount = ethers.utils.parseEther(withdrawAmount)
        const withdrawLiquidityOptions = {
            abi: dexAbi,
            contractAddress: dexAddress,
            functionName: "withdrawLiquidity",
            params: {
                withdrawAmount: amount,
            }
        }
        const withdrawLiquidityTx = await runContractFunction({
            params: withdrawLiquidityOptions,
        })
        txInProgressToast()
        let withdrawLiquidityReceipt
        try {
            withdrawLiquidityReceipt = await withdrawLiquidityTx.wait(1)
        } catch (error) {
            handleWithdrawError(error)
        }
        if(withdrawLiquidityReceipt) {
            handleWithdrawSuccess(withdrawLiquidityReceipt)
        }   
        setWithdrawAmount(0)
    }

    useEffect(() => {
        calculateDeposit()
    }, [depositAmount])

    useEffect(() => {
        calculateWithdraw()
    }, [withdrawAmount])

    const liquidityColor = useColorModeValue('violet.400', 'mustard.300')

    const displayDepositAmounts = () => {
        if(depositAmount > 0) {
            return(
                <Text fontSize='xs' color={liquidityColor}>
                    Total Deposit: {parseFloat(depositAmount).toFixed(3)} ETH, &nbsp;
                    {parseFloat(tokenDepositAmount).toFixed(3)} NOSE
                </Text>
            )
        }
    }

    const displayWithdrawAmounts = () => {
        if(withdrawAmount > 0) {
            return(
                <Text fontSize='xs' color={liquidityColor}>
                    Total Withdrawal: {parseFloat(ethWithdraw).toFixed(3)} ETH,  &nbsp;
                    {parseFloat(tokenWithdraw).toFixed(3)} NOSE
                </Text>
            )
        }
    }

    return (
        <VStack alignItems='flex-start'>
            <Heading size='lg'>Liquidity</Heading>
            <HStack minW='30vw'>
                <Text fontSize='sm'>Total Liquidity: </Text>
                <Text color={liquidityColor}>{parseFloat(totalLiquidity).toFixed(3)}</Text>
                <Spacer/>
                <Text fontSize='sm'>User Liquidity: </Text>
                <Text color={liquidityColor}>{parseFloat(userLiquidity).toFixed(3)}</Text>
            </HStack>
            <FormControl >
                <FormLabel>Deposit Liquidity</FormLabel>
                <HStack spacing={6}>
                    <NumberInput
                        min={0}
                        precision={2}
                        w={{base: '30vw' ,md:'15vw'}}
                        size='sm'
                    >
                        <NumberInputField 
                            rounded={5}
                            placeholder={'ETH amount'}
                            onChange={e => setDepositAmount(e.target.value)}
                        />
                    </NumberInput>
                    <Button
                        variant='primary'
                        size='sm'
                        w={{base: '15vw' ,md:'7.5vw'}}
                        isDisabled={!(depositAmount > 0)}
                        onClick={() => deposit()}
                    >
                        Deposit
                    </Button>
                </HStack>
            </FormControl>
            {displayDepositAmounts()}

            <FormControl >
                <FormLabel>Withdraw Liquidity</FormLabel>
                <HStack spacing={6}>
                    <NumberInput
                        min={0}
                        precision={2}
                        w={{base: '30vw' ,md:'15vw'}}
                        size='sm'
                    >
                        <NumberInputField 
                            rounded={5}
                            placeholder={'Withdraw amount'}
                            onChange={e => setWithdrawAmount(e.target.value)}
                        />
                    </NumberInput>
                    <Button
                        variant='primary'
                        size='sm'
                        w={{base: '15vw' ,md:'7.5vw'}}
                        isDisabled={!(withdrawAmount > 0)}
                        onClick={() => withdraw()}
                    >
                        Withdraw
                    </Button>
                </HStack>
            </FormControl>
            {displayWithdrawAmounts()}

        </VStack>
    )
}
