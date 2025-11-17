// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.20; // Reverted to 0.8.20 as in your example

// --- INTERFACES ---

interface IMarketplace {
    // We need the full Order struct definition from Marketplace.sol
    struct Order {
        address seller;
        uint256 yTokenAmountOriginal;
        uint256 yTokenAmountRemaining;
        uint256 premiumPerSmallestAssetUnit;
        bool isActive;
    }

    function orderCounter() external view returns (uint256);
    function orders(uint256 orderId) external view returns (Order memory);
    function Y_TOKEN() external view returns(address);
}

interface ILT {
    // Matched function name from your example
    function preview_withdraw(uint256) external view returns(uint256); 
}

/**
 * @title BatchRangeOrders
 * @notice A helper contract to fetch a specific range of *active* sell orders.
 * @dev Fetches orders in descending order from a start index to an end index.
 */
contract BatchRangeMyOrders {

    // Struct for the return data
    struct PaginatedMyOrder {
        uint256 orderId;
        address seller;
        uint256 yTokenAmountRemaining;
        uint256 underlyingAmountRemaining;
        uint256 premiumPerSmallestAssetUnit;
        bool isActive;
    }

    /**
     * @param _marketplace The address of the Marketplace contract
     * @param _startIndex_desc The highest order ID to fetch (e.g., 99). Must be < orderCounter.
     * @param _endIndex_incl The lowest order ID to fetch (e.g., 80).
     */
    constructor(
        address _marketplace,
        uint256 _startIndex_desc,
        uint256 _endIndex_incl
    ) {

        IMarketplace marketplace = IMarketplace(_marketplace);   
        address Y_TOKEN = marketplace.Y_TOKEN();     
        uint256 totalOrders = marketplace.orderCounter();

        PaginatedMyOrder[] memory orders;

        // --- 1. Validation and Edge Case Handling ---
        
        // We set paginatedOrders to an empty array if checks fail.
        if (
            totalOrders == 0 ||
            _endIndex_incl > _startIndex_desc ||
            _startIndex_desc >= totalOrders
        ) {
            orders = new PaginatedMyOrder[](0);
        } else {
            // --- 2. Fetch Orders (Validation Passed) ---

            // Example: 99 - 80 + 1 = 20
            uint256 rangeSize = _startIndex_desc - _endIndex_incl + 1;
            
            // Create a temporary, fixed-size array to hold potential results
            orders = new PaginatedMyOrder[](rangeSize);

            for (uint256 i = 0; i < rangeSize; i++) {
                uint256 currentOrderId = _startIndex_desc - i;
                IMarketplace.Order memory o = marketplace.orders(currentOrderId);

                uint256 underlying = 0;
                // yTokenAmountRemaining should be > 0 if it's active
                if(o.yTokenAmountRemaining > 0) {
                    underlying = ILT(Y_TOKEN).preview_withdraw(o.yTokenAmountRemaining);    
                }

                orders[i] = PaginatedMyOrder(
                    currentOrderId,
                    o.seller,
                    o.yTokenAmountRemaining,
                    underlying,
                    o.premiumPerSmallestAssetUnit,
                    o.isActive
                );
                    
            }
        }

        // --- 4. Return Data (Single Assembly Block) ---
        // This block is now the only return path.
        bytes memory _data = abi.encode(orders);
        assembly {
            // The first 32 bytes of _data store its length.
            // We skip those and return the raw data content.
            let _dataStart := add(_data, 32)
            let _dataLength := mload(_data)
            return(_dataStart, _dataLength)
        }
    }
}