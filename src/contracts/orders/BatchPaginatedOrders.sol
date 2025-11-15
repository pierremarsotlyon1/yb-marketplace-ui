// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    function preview_withdraw(uint256) external view returns(uint256);
}

/**
 * @title BatchRangeOrders
 * @notice A helper contract to fetch a specific range of sell orders.
 * @dev Fetches orders in descending order from a start index to an end index.
 */
contract BatchRangeOrders {

    // Struct for the return data
    struct PaginatedOrder {
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

        // Example: 99 - 80 + 1 = 20 orders
        uint256 count = _startIndex_desc - _endIndex_incl + 1;
        PaginatedOrder[] memory paginatedOrders = new PaginatedOrder[](count);

        for (uint256 i = 0; i < count; i++) {
           
            uint256 currentOrderId = _startIndex_desc - i;

            IMarketplace.Order memory o = marketplace.orders(currentOrderId);

            uint256 underlying = ILT(Y_TOKEN).preview_withdraw(o.yTokenAmountRemaining);    

            paginatedOrders[i] = PaginatedOrder(
                currentOrderId,
                o.seller,
                o.yTokenAmountRemaining,
                underlying,
                o.premiumPerSmallestAssetUnit,
                o.isActive
            );
        }

        // --- 3. Return Data ---
        bytes memory _data = abi.encode(paginatedOrders);
        assembly {
            let _dataStart := add(_data, 32)
            let _dataLength := mload(_data)
            return(_dataStart, _dataLength)
        }
    }
}