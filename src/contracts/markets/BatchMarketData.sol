// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// --- INTERFACES ---

interface IMarketplaceFactory {
    function getDeployedMarketplacesCount() external view returns (uint256);
    function deployedMarketplaces(uint256 index) external view returns (address);
}

interface IMarketplace {
    function Y_TOKEN() external view returns (address);
}

interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function balanceOf(address) external view returns(uint256);
}

interface Lt {
    function CRYPTOPOOL() external view returns(address);
    function ASSET_TOKEN() external view returns(address);
    function pricePerShare() external view returns(uint256);
}

interface CryptoPool {
    function price_oracle() external view returns(uint256);
}

/**
 * @title BatchMarketData
 * @notice A helper contract to fetch all market data in a single eth_call.
 * @dev This contract is intended to be deployed off-chain via `eth_call`.
 * It takes the factory address as a constructor argument, fetches all
 * market data, ABI-encodes the result, and returns it.
 * @dev This version does NOT use try/catch. If any sub-call (e.g., Y_TOKEN(), name())
 * reverts, the entire contract call will revert.
 */
contract BatchMarketData {

    struct MarketData {
        address marketplaceAddress;
        address yTokenAddress;
        address assetToken;
        string name;
        string symbol;
        uint256 factoryBalance;
        uint256 pricePerShare;
        uint256 oraclePrice;
    }

    /**
     * @param _factoryAddress The address of the MarketplaceFactory
     */
    constructor(address _factoryAddress) {
        IMarketplaceFactory factory = IMarketplaceFactory(_factoryAddress);
        uint256 marketCount = factory.getDeployedMarketplacesCount();

        // The array is sized directly. No need for a temporary array
        // because if any call fails, the whole execution reverts.
        MarketData[] memory markets = new MarketData[](marketCount);

        for (uint256 i = 0; i < marketCount; i++) {
            address marketplaceAddr = factory.deployedMarketplaces(i);
                        
            // 1. Get yToken address from Marketplace
            address yTokenAddr = IMarketplace(marketplaceAddr).Y_TOKEN();

            // 2. Get yToken details
            string memory name = IERC20(yTokenAddr).name();
            string memory symbol = IERC20(yTokenAddr).symbol();

            // 3. Get TVL info
            uint256 factoryBalance = IERC20(yTokenAddr).balanceOf(marketplaceAddr);
            uint256 pricePerShare = Lt(yTokenAddr).pricePerShare();
            address cryptopool = Lt(yTokenAddr).CRYPTOPOOL();
            address assetToken = Lt(yTokenAddr).ASSET_TOKEN();
            uint256 oraclePrice = CryptoPool(cryptopool).price_oracle();
            
            // 3. Store data
            markets[i] = MarketData(
                marketplaceAddr,
                yTokenAddr,
                assetToken,
                name,
                symbol,
                factoryBalance,
                pricePerShare,
                oraclePrice
            );
        }

        // ABI-encode the final array
        bytes memory _data = abi.encode(markets);

        // Return the encoded data using inline assembly
        assembly {
            // The first 32 bytes of _data store its length.
            // We skip those and return the raw data content.
            let _dataStart := add(_data, 32)
            let _dataLength := mload(_data)
            return(_dataStart, _dataLength)
        }
    }
}