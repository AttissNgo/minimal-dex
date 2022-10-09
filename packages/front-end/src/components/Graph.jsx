import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import Chart from "react-apexcharts" 
import { Heading, useColorModeValue, VStack } from '@chakra-ui/react'

export default function Graph({ 
    ethReserve, 
    tokenReserve, 
    swapType, 
    addingEth, 
    addingToken, 
    dex, 
    calculatedOutput }) 
{
    const inputColor = '#396cf7'
    const outputColor = '#fc9723'

    const [ethGoalName, setEthGoalName] = useState('ETH input')
    const [tokenGoalName, setTokenGoalName] = useState('Token input')
    const [ethGoalValue, setEthGoalValue] = useState(0)
    const [tokenGoalValue, setTokenGoalValue] = useState(0)
    const [ethGoalColor, setEthGoalColor] = useState(inputColor)
    const [tokenGoalColor, setTokenGoalColor] = useState(outputColor)

    const seriesColor = useColorModeValue('#A825B2', '#B2A825')

    const goals = () => {
        if(swapType === 'ethToNose') {
            setEthGoalName('ETH input')
            setEthGoalValue(parseFloat(addingEth).toFixed(5))
            setEthGoalColor(inputColor)
            setTokenGoalName('NOSE output')
            if(addingEth > 0) {
                setTokenGoalValue(parseFloat(calculatedOutput).toFixed(5))
            } else {
                setTokenGoalValue(0)
            }
            setTokenGoalColor(outputColor)
        } else {
            setEthGoalName('ETH output')
            if(addingToken > 0) {
                setEthGoalValue(parseFloat(calculatedOutput).toFixed(5))
            } else {
                setEthGoalValue(0)
            }
            setEthGoalColor(outputColor)
            setTokenGoalName('NOSE input')
            setTokenGoalValue(parseFloat(addingToken).toFixed(5))
            setTokenGoalColor(inputColor)
        }
    }

    useEffect(() => {
        goals()
    }, [swapType, addingEth, addingToken, calculatedOutput])

    const options = {
        chart: {
            type: 'bar',
            toolbar: {
                show: false
            },
            redrawOnParentResize: true,
            redrawOnWindowResize: true,
            
            
        },
        plotOptions: {
            bar: {
                horizontal: true
            }
        },
        tooltip: {
            theme: 'dark'
        },
        colors: seriesColor,
        yaxis: [{
            labels: {
                style: {
                    colors: seriesColor
                }
            }
        }],
        
    }

    const series = [{
        name: '',
        data: [{
          x: 'ETH Reserve',
          y: parseFloat(ethReserve).toFixed(5),
          goals: [
            {
              name: ethGoalName,
              value: ethGoalValue,
              strokeColor: ethGoalColor,
              strokeWidth: 4
            }
          ]
        }, {
          x: 'NOSE Reserve',
          y: parseFloat(tokenReserve).toFixed(5),
          goals: [
            {
              name: tokenGoalName,
              value: tokenGoalValue,
              strokeColor: tokenGoalColor,
              strokeWidth: 4
            }
          ]
        }]
    }]

    return(
        <VStack alignItems='flex-start'>
            <Heading size='md'>Reserves</Heading>
            <Chart
                options={options}
                series={series}
                type='bar'
                width='100%'
                height='100%'
                />
        </VStack>
    )
}
