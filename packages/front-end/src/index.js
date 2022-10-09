import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MoralisProvider } from "react-moralis"
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme/index.js'
import "@fontsource/fredoka"
import "@fontsource/krub"
import "@fontsource/martel-sans"
import "@fontsource/oxygen"

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <MoralisProvider initializeOnMount={false}>
            <ChakraProvider theme={theme}>
                <App />
            </ChakraProvider>
        </MoralisProvider>
    </React.StrictMode>
)


