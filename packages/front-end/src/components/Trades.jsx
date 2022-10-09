import React, { useEffect, useState } from 'react'
import { Eth, ChevronRight2X } from '@web3uikit/icons'
import { ethers } from 'ethers'
import { NETWORKS } from '../constants/networks'
import { 
    Heading, 
    Link,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    VStack, 
    HStack,
    Select,
    Text,
    useColorModeValue,
    Box
} from '@chakra-ui/react'

export default function Trades({ ethToToken, tokenToEth }) {

    const [tradeType, setTradeType] = useState('allTrades')
    const [trades, setTrades] = useState([])

    const noseText = useColorModeValue('mustard.900', 'mustard.100')

    const tradesFilter = () => {
        let tradesToDisplay = []
        if(tradeType === 'allTrades') {
            tradesToDisplay = [...ethToToken, ...tokenToEth]
        } else if(tradeType === 'ethToToken') {
            tradesToDisplay = [...ethToToken]
        } else if(tradeType === 'tokenToEth') {
            tradesToDisplay = [...tokenToEth]
        }
        tradesToDisplay.sort((a,b) => {return(b.blockNumber - a.blockNumber)})
        setTrades(tradesToDisplay)
    }

    const displayAddress = (address) => {
        return(
            <HStack>
                <Link href={`${NETWORKS.goerli.blockExplorer}address/${address}`} isExternal>
                    {address.substr(0,4)+'...'+address.substr(-6)}
                </Link>
            </HStack>
        )
    }

    const renderTrades = () => {
        return(
            trades.map((trade) => {
                let input, output
                if(trade.event === "SwapEthForToken") {
                    input = parseFloat(ethers.utils.formatEther(trade.args.ethInput)).toFixed(3)
                    output = parseFloat(ethers.utils.formatEther(trade.args.tokenOutput)).toFixed(3)
                } else {
                    input = parseFloat(ethers.utils.formatEther(trade.args.tokenInput)).toFixed(3)
                    output = parseFloat(ethers.utils.formatEther(trade.args.ethOutput)).toFixed(3)
                }
                return(
                    <Tr key={trade.transactionHash}>
                        <Td>
                            {trade.event === "SwapEthForToken" ?
                                <HStack>
                                    <Eth/><ChevronRight2X fontSize='12px'/><Text>👃</Text>
                                </HStack> :
                                <HStack>
                                    <Text>👃</Text><ChevronRight2X fontSize='12px'/><Eth/>
                                </HStack>
                            }
                        </Td>
                        <Td pl={2} color={trade.event === "SwapEthForToken" ? 'blue' : noseText}>
                            {input}
                        </Td>
                        <Td pl={2} color={trade.event === "SwapEthForToken" ? noseText : 'blue'}>
                            {output}
                        </Td>
                        <Td pl={2}>
                            {displayAddress(trade.args.user)}
                        </Td>
                        <Td>{trade.blockNumber}</Td>
                    </Tr>
                )
            })
        )
    }

    useEffect(() => {
        tradesFilter()
    }, [tradeType, ethToToken, tokenToEth])

    return (
        <VStack alignItems='flex-start'>
            <HStack spacing={8}>
                <Heading size='md'>Trades</Heading>
                <Select size='xs' onChange={(e) => setTradeType(e.target.value)}>
                    <option value='allTrades'>All Trades</option>
                    <option value='ethToToken'>ETH to NOSE</option>
                    <option value='tokenToEth'>NOSE to ETH</option>
                </Select>
            </HStack>

            <Box w={{ base: '75vw', md: '35vw'}} overflow='auto' maxH='30vh'>
            <TableContainer overflowY='scroll'>
                <Table variant='simple' size='sm'>
                    <Thead>
                        <Tr>
                            <Th w='10vw'>Type</Th>
                            <Th pl={2} w='10vw'>Input</Th>
                            <Th pl={2} w='10vw'>Output</Th>
                            <Th pl={2} w='10vw'>Address</Th>
                            <Th pl={2}>Block</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {renderTrades()}
                    </Tbody>
                </Table>
            </TableContainer>
            </Box>
        </VStack>

    )
}
