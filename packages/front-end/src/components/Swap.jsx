import React, { useState, useEffect } from 'react'
import { Eth, ChevronRight2X } from '@web3uikit/icons'
import { ethers } from 'ethers'
import { useWeb3Contract } from 'react-moralis'
import { 
    FormControl, 
    Heading, 
    HStack, 
    NumberInput,
    NumberInputField,
    Select, 
    Text, 
    VStack, 
    Button,
    useColorModeValue,
    useToast
} from '@chakra-ui/react'

import dexAbi from '../constants/MinimalDex.json'
import tokenAbi from '../constants/NoseToken.json'

export default function Swap({ 
    dexAddress,
    tokenAddress,
    addingEth,
    addingToken,
    handleAddEth, 
    handleAddToken, 
    handleSwapType, 
    handleSwapSuccess,
    swapType, 
    calculatedOutput, 
    approvalInProgressToast,
    handleApprovalSuccess,
    txInProgressToast }) 
{
    var console = require("console-browserify")

    const { runContractFunction } = useWeb3Contract()

    const [formInputValue, setFormInputValue] = useState(0)

    const toast = useToast()

    function closeToast() {
        toast.closeAll()
    }

    const handleSwapError = (error) => {
        console.log(error)
        closeToast()
        toast({
            title: 'Exchange error',
            description: 'Unable to exchange',
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    }

    const handleApprovalError = (error) => {
        console.log(error)
        closeToast()
        toast({
            title: 'Approval error',
            description: 'Unable to approve tokens for swap',
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    }

    const handleInput = () => {
        handleAddToken(0)
        handleAddEth(0)
        if(swapType === 'ethToNose') {
            handleAddEth(formInputValue.toString())
        } else {
            handleAddToken(formInputValue.toString())
        }
    }

    const swapEthToToken = async () => {
        const ethAmount = ethers.utils.parseEther(addingEth)
        const options = {
            abi: dexAbi,
            contractAddress: dexAddress,
            functionName: "ethToToken",
            msgValue: ethAmount,
        }
        const ethToTokenTx = await runContractFunction({
            params: options,
        })
        txInProgressToast()
        let ethToTokenReceipt
        try {
            ethToTokenReceipt = await ethToTokenTx.wait()
        } catch (error) {
            handleSwapError(error)
        }
        if(ethToTokenReceipt) {
            handleSwapSuccess(ethToTokenReceipt)
        }
    }

   const swapTokenToEth = async () => {
        const oneWei = ethers.utils.parseUnits('1', "wei")
        const tokenAmount = ethers.utils.parseEther(addingToken).add(oneWei)
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
        const options = {
            abi: dexAbi,
            contractAddress: dexAddress,
            functionName: "tokenToEth",
            params: {
                tokenInput: tokenAmount
            },
        }
        const tokenToEthTx = await runContractFunction({
            params: options,
        })
        txInProgressToast()
        let tokenToEthReceipt
        try {
            tokenToEthReceipt = await tokenToEthTx.wait()
        } catch (error) {
            handleSwapError(error)
        }
        if(tokenToEthReceipt) {
            handleSwapSuccess(tokenToEthReceipt)
        }
    }

    useEffect(() => {
        handleInput()
    }, [formInputValue, swapType])

    const outputColor = useColorModeValue('violet.400', 'mustard.300')

    const displayOutput = () => {
        if(calculatedOutput > 0) {
            let outputType
            if(swapType === 'ethToNose') outputType = 'NOSE'
            else outputType = 'ETH'
            return(
                <Text fontSize='xs' color={outputColor}>
                    Calculated output: {parseFloat(calculatedOutput).toFixed(5)} {outputType}
                </Text>
            )
        }
    }

    return (
        <VStack alignItems='flex-start'>
            <HStack spacing={6}>
                <Heading size='lg'>Swap</Heading>
                <Text fontSize='2xl'>
                    {swapType === 'ethToNose' ? <Eth/> : '👃'}  
                </Text>
                <ChevronRight2X fontSize='30px'/>
                <Text fontSize='2xl'>
                    {swapType === 'ethToNose' ? '👃' : <Eth/>}  
                </Text>
                
            </HStack>
            <FormControl>
                <Select pt={2} 
                    size='sm'
                    w={{base: '30vw' ,md:'15vw'}}
                    rounded={5}
                    onChange={(e) => handleSwapType(e.target.value)}
                >
                    <option value='ethToNose'>ETH to NOSE</option>
                    <option value='noseToEth'>NOSE to ETH</option>
                </Select>
                <HStack pt={2} spacing={6}>
                    <NumberInput 
                        min={0}
                        precision={2}
                        step={0.01}
                        w={{base: '30vw' ,md:'15vw'}}
                        size='sm'
                    >
                    <NumberInputField 
                        rounded={5}
                        placeholder={`${swapType === 'ethToNose' ? 'ETH' : 'NOSE'} amount`}
                        onChange={e => setFormInputValue(e.target.value)}
                    />
                    </NumberInput>
                    <Button
                        variant='primary'
                        size='sm'
                        w={{base: '15vw' ,md:'7.5vw'}}
                        isDisabled={!(formInputValue > 0)}
                        onClick={swapType === 'ethToNose' ?
                            () => swapEthToToken() :
                            () => swapTokenToEth()
                        }
                    >
                        Swap
                    </Button>
                </HStack>
            </FormControl>
            {displayOutput()}
        </VStack>
    )
}
