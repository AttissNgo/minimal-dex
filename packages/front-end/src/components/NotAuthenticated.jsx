import React from 'react'

import {
    Container,
    Heading,
    useColorModeValue,
    VStack
} from '@chakra-ui/react'

export default function NotAuthenticated() {

    const bg = useColorModeValue('mustard.300', 'teal.800')

    return (
        <Container centerContent pt={5}>
            <VStack 
                w={{base: '80vw', md: '60vw'}}
                minH='50vh'
                backgroundColor={bg}
                borderRadius={8}
                py={4}
                px={6}
                justifyContent='center'
            >
                <Heading size='md'>Please Connect Wallet To Goerli Testnet</Heading>
            </VStack>
        </Container>
    )
}