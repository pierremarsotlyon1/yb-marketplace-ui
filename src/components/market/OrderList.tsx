"use client"; // We need state and hooks for sorting
import React, { Fragment, useMemo, useState } from 'react'; // Import useMemo and useState
import Link from 'next/link';
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'; // Import sort icons
import { OrderRow } from '@/components/market/OrderRow';
import { Market } from '@/interfaces/Market';
import { Order } from '@/interfaces/Order';
import { Address } from 'viem';
import { useFetchAllOrders } from '@/hooks/useFetchPaginatedOrders';
// --- Sorting Logic ---

// 1. Define sortable keys (must match 'Order' interface fields)
type SortKey = 'amountFormatted' | 'worthUnderlying' | 'premiumFormatted' | 'premium' | 'premiumPerSmallestAssetUnitFormatted';

// 2. Define the sort configuration interface
interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}
// --- End Sorting Logic ---


// Interface for component props
interface OrderListProps {
    market: Market;
    onBuyOrder: (order: Order) => void;
}

/**
 * OrderList Component
 * Shows a list of individual orders with sortable columns.
 */
const OrderList: React.FC<OrderListProps> = ({ market, onBuyOrder }) => {

    // 1. Use the fetch hook
    const {
        data: orders, // 'data' is the unsorted array
        error,
        isFetching,
    } = useFetchAllOrders(market.id as Address);

    // 2. Add state for sorting
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // 3. Memoize the sorted order array
    const sortedOrders = useMemo(() => {
        let sortableOrders = orders ? [...orders] : []; // Create a copy of the array
        if (sortConfig !== null) {
            sortableOrders.sort((a, b) => {
                // Use the sort key to access the property
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableOrders;
    }, [orders, sortConfig]);

    // 4. Function to request a sort (3-state cycle: desc -> asc -> none)
    const requestSort = (key: SortKey) => {
        if (sortConfig && sortConfig.key === key) {
            // Case 1: Currently sorting by this key
            if (sortConfig.direction === 'desc') {
                // Was desc, switch to asc
                setSortConfig({ key, direction: 'asc' });
            } else {
                // Was asc, switch to null (reset)
                setSortConfig(null);
            }
        } else {
            // Case 2: Not sorting by this key (or no sort at all)
            // Start with desc
            setSortConfig({ key, direction: 'desc' });
        }
    };
    
    // (Removed unused getSortIcon helper)

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/20">
            {/* List Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                <Link
                    href="/"
                    className="p-1 text-zinc-400 rounded-full hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <img src={market.iconUrl} alt={market.name} className="h-6 w-6 rounded-full" />
                <h1 className="text-xl font-semibold text-white">{market.name} Orders</h1>
            </div>

            {/* Table Header (MODIFIED WITH BUTTONS) */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-zinc-800 text-xs font-medium text-zinc-400">
                
                <SortableHeader
                    title="Amount"
                    sortKey="amountFormatted"
                    className="col-span-3"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                />
                <SortableHeader
                    title="Underlying Worth"
                    sortKey="worthUnderlying"
                    className="col-span-3"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                />
                <SortableHeader
                    title="Cost (crvUSD)"
                    sortKey="premiumFormatted"
                    className="col-span-2"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                />
                <SortableHeader
                    title="Premium"
                    sortKey="premium"
                    className="col-span-1"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                />
                <SortableHeader
                    title="crvUSD per unit"
                    sortKey="premiumPerSmallestAssetUnitFormatted"
                    className="col-span-2"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                />

                <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Order Rows (uses sortedOrders) */}
            <div className="flex flex-col min-h-[300px]">
                {isFetching && sortedOrders.length === 0 ? (
                    <div className="p-4 text-center text-zinc-400">Loading orders...</div>
                ) : error ? (
                    <div className="p-4 text-center text-red-400">Error fetching orders.</div>
                ) : sortedOrders.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500">No active orders found for this market.</div>
                ) : (
                    // 6. Map over the sorted array
                    sortedOrders.map((order) => (
                        <OrderRow
                            key={order.orderId.toString()}
                            order={order}
                            market={market}
                            onBuy={() => onBuyOrder(order)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// --- Helper Component for Sortable Headers ---
interface SortableHeaderProps {
    title: string;
    sortKey: SortKey;
    className?: string;
    sortConfig: SortConfig | null;
    requestSort: (key: SortKey) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ title, sortKey, className, sortConfig, requestSort }) => {
    
    const isSorting = sortConfig?.key === sortKey;
    
    return (
        <button
            onClick={() => requestSort(sortKey)}
            className={`flex items-center gap-1 text-left transition-colors hover:text-zinc-200 ${className || ''}`}
        >
            <span>{title}</span>
            {/* Display the icon */}
            {isSorting ? (
                sortConfig?.direction === 'asc' ? 
                <ArrowUp className="h-3 w-3 text-white" /> : 
                <ArrowDown className="h-3 w-3 text-white" />
            ) : (
                <ArrowDown className="h-3 w-3 text-zinc-600" /> // Default (unsorted) icon
            )}
        </button>
    );
};

export default OrderList;