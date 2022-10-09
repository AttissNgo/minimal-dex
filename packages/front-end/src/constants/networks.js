const INFURA_ID = process.env.REACT_APP_INFURA_ID

export const NETWORKS = {
    localhost: {
        name: "localhost",
        chainId: 31337,
        blockExplorer: '',
        chainHex: '0x7a69',
        rpcUrl: "http://" + window.location.hostname + ":8545",
    },
    mainnet: {
        name: "mainnet",
        chainId: 1,
        rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
        blockExplorer: "https://etherscan.io/",
    },
    goerli: {
        name: "goerli",
        chainId: 5,
        chainHex: '0x5',
        blockExplorer: "https://goerli.etherscan.io/",
        rpcUrl: `https://goerli.infura.io/v3/${INFURA_ID}`,
    },
}