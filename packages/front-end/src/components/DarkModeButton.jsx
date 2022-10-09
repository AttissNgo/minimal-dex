import React from 'react'

import { 
    Button,
    useColorMode, 
    useColorModeValue, 
} from '@chakra-ui/react'

export default function DarkModeButton() {
    
    const { toggleColorMode, colorMode} = useColorMode() 
    
    const darkModeBackground = useColorModeValue('grey', 'yellow.100')

    return (
        <Button className='darkModeButton' 
            bg={darkModeBackground} 
            size='xs'
            onClick={toggleColorMode}
        >
            {colorMode === 'dark' ? '🌞' : '🌙'}
        </Button>
    )
            
}