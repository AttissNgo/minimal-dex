// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

error MinimalDex__alreadyHasLiquidity();
error MinimalDex__tokenAmountMustEqualEthAmount();
error MinimalDex__userTokenBalanceInsufficient();
error MinimalDex__transactionFailed();
error MinimalDex__insufficientUserLiquidity();

contract MinimalDex {

    IERC20 token;

    uint256 private s_totalLiquidity;
    mapping(address => uint256) private s_userLiquidity;

    event SwapEthForToken(address user, uint256 ethInput, uint256 tokenOutput);
    event SwapTokenForEth(address user, uint256 tokenInput, uint256 ethOutput);
    event LiquidityProvided(address user, uint256 liquidityMinted, uint256 ethDeposited, uint256 tokensDeposited);
    event LiquidityRemoved(address user, uint256 liquidityRemoved, uint256 ethWithdrawn, uint256 tokensWithdrawn);

    /**
     * @notice sets address of ERC20 token for exchange
     */
    constructor (address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    fallback() external payable {
        console.log("----- fallback:", msg.value);
    }

    receive() external payable {
        console.log("----- receive:", msg.value);
    }

    /**
     * @notice Provides initial liquidity to DEX 
     * @param tokens amount of tokens to be deposited to DEX
     * @return s_totalLiquidity amount of liquidity 'tokens' minted 
     */
    function initializeLiquidity(uint256 tokens) public payable returns (uint256) {
        if (s_totalLiquidity != 0) {
            revert MinimalDex__alreadyHasLiquidity();
        }
        if (msg.value != tokens) {
            revert MinimalDex__tokenAmountMustEqualEthAmount();
        }
        s_totalLiquidity = address(this).balance;
        s_userLiquidity[msg.sender] = s_totalLiquidity;
        require(token.transferFrom(msg.sender, address(this), tokens), "Initial liquidity deposit failed");
        return s_totalLiquidity;
    }

    /**
     * @notice returns yOutput, or yDelta for xInput (or xDelta). 
     * NOTE: Follows simple x * y = k pricing model.
     */
    function calculatePrice(
        uint256 xInput,
        uint256 xReserves,
        uint256 yReserves
    ) public pure returns (uint256 yOutput) {
        uint256 xInputPlusFee = xInput * 997; 
        uint256 numerator = xInputPlusFee * yReserves; 
        uint256 denominator = (xReserves * 1000) + xInputPlusFee; 
        return (numerator / denominator);
    }

    /**
     * @notice sends Ether to DEX in exchange for token
     */
    function ethToToken() public payable returns (uint256 tokenOutput) {
        uint256 ethReserves = address(this).balance - msg.value;
        uint256 tokenReserves = token.balanceOf(address(this));
        tokenOutput = calculatePrice(msg.value, ethReserves, tokenReserves);
        require(token.transfer(msg.sender, tokenOutput), "Transaction failed!");
        emit SwapEthForToken(msg.sender, msg.value, tokenOutput);
        return tokenOutput;
    }

    /**
     * @notice sends token to DEX in exchange for ETH
     */
    function tokenToEth(uint256 tokenInput) public returns (uint256 ethOutput) {
        if (token.balanceOf(msg.sender) < tokenInput) {
            revert MinimalDex__userTokenBalanceInsufficient();
        }
        uint256 tokenReserves = token.balanceOf(address(this));
        uint256 ethReserves = address(this).balance;
        ethOutput = calculatePrice(tokenInput, tokenReserves, ethReserves);
        require(token.transferFrom(msg.sender, address(this), tokenInput), "Token transfer failed");
        (bool success, ) = msg.sender.call{ value: ethOutput }("");
        if (!success) {
            revert MinimalDex__transactionFailed();
        }
        emit SwapTokenForEth(msg.sender, tokenInput, ethOutput);
        return ethOutput;
    }

    /**
     * @notice takes both ETH and token from user and mints new liquidity
     * NOTE: param is msg.value sent with call. This will be used with AMM to calculate amount of tokens to be transferred.
     * NOTE: user must approve DEX to spend their tokens before calling
     */
    function addLiquidity() public payable returns (uint256 tokensDeposited) {
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 tokenDeposit;
        tokenDeposit = ((msg.value * tokenReserve) / ethReserve) + 1;
        if (token.balanceOf(msg.sender) < tokenDeposit) {
            revert MinimalDex__userTokenBalanceInsufficient();
        }
        uint256 liquidityMinted = msg.value * s_totalLiquidity / ethReserve;
        s_userLiquidity[msg.sender] += liquidityMinted;
        s_totalLiquidity += liquidityMinted;
        require(token.transferFrom(msg.sender, address(this), tokenDeposit), "Token transfer failed");
        emit LiquidityProvided(msg.sender, liquidityMinted, msg.value, tokenDeposit);
        return tokenDeposit;
    }

    /**
     * @notice returns both ETH & tokens when user withdraws liquidity from DEX
     * @param withdrawAmount amount of liquidity to withdraw from pool
     * @return ethWithdrawAmount amount of ETH to be returned to user when liquidity is withdrawn
     * @return tokenWithdrawAmount amount of tokens to be returned to user when liquidity is withdrawn
     * NOTE: as amounts could be very low in the case of low liquidity, UI should show amount before calling function
     */
    function withdrawLiquidity(uint256 withdrawAmount) public returns (uint256 ethWithdrawAmount, uint256 tokenWithdrawAmount) {
        if (withdrawAmount > s_userLiquidity[msg.sender]) {
            revert MinimalDex__insufficientUserLiquidity();
        }
        uint256 ethReserve = address(this).balance;
        uint256 tokenReserve = token.balanceOf(address(this));
        ethWithdrawAmount = (withdrawAmount * ethReserve) / s_totalLiquidity;
        tokenWithdrawAmount = (withdrawAmount * tokenReserve) / s_totalLiquidity;
        s_totalLiquidity -= withdrawAmount;
        s_userLiquidity[msg.sender] -= withdrawAmount;
        require(token.transfer(msg.sender, tokenWithdrawAmount), "Token transfer failed");
        (bool success, ) = msg.sender.call{ value: ethWithdrawAmount }("");
        if (!success) {
            revert MinimalDex__transactionFailed();
        } 
        emit LiquidityRemoved(msg.sender, withdrawAmount, ethWithdrawAmount, tokenWithdrawAmount);
        return (ethWithdrawAmount, tokenWithdrawAmount);
    }


    function getTotalLiquidity() public view returns(uint256) {
        return s_totalLiquidity;
    }

    function getUserLiquidity(address user) public view returns(uint256) {
        return s_userLiquidity[user];
    }
}