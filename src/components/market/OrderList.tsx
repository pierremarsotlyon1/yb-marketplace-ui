import React, { Fragment } from 'react'; // Import Fragment
import Link from 'next/link'; // Import Link
import { ArrowLeft } from 'lucide-react';
import { OrderRow } from './OrderRow';
// Assurez-vous que les chemins sont corrects
import { Market } from '../../interfaces/Market';
import { Order } from '../../interfaces/Order';
import { Address } from 'viem';
import { useFetchAllOrders } from '@/hooks/useFetchPaginatedOrders';

// Interface for component props
interface OrderListProps {
    market: Market;
    onBuyOrder: (order: Order) => void;
    // 'onBack' est supprimé, géré par <Link>
}

/**
 * OrderList Component
 * Shows a list of individual orders for a selected market.
 */
const OrderList: React.FC<OrderListProps> = ({ market, onBuyOrder }) => {

    // 1. Utiliser le hook de pagination
    const {
        data,
        error,
        isFetching,
    } = useFetchAllOrders(market.id as Address);

    // 2. Aplatir les pages de données
    const orders = data || [];

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/20">
            {/* List Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                {/* Bouton de retour est maintenant un Link */}
                <Link
                    href="/"
                    className="p-1 text-zinc-400 rounded-full hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <img src={market.iconUrl} alt={market.name} className="h-6 w-6 rounded-full" />
                <h1 className="text-xl font-semibold text-white">{market.name} Orders</h1>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-zinc-800 text-xs font-medium text-zinc-400">
                <div className="col-span-3">Amount</div>
                <div className="col-span-3">Underlying Worth</div>
                <div className="col-span-1">Premium</div>
                <div className="col-span-2">Cost (crvUSD)</div>
                <div className="col-span-2">crvUSD per unit</div>
                <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Order Rows */}
            <div className="flex flex-col min-h-[300px]">
                {isFetching && orders.length === 0 ? (
                    <div className="p-4 text-center text-zinc-400">Loading orders...</div>
                ) : error ? (
                    <div className="p-4 text-center text-red-400">Error fetching orders.</div>
                ) : orders.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500">No active orders found for this market.</div>
                ) : (
                    // Mapper à travers les pages et les ordres
                    orders.map((order) => (
                        <OrderRow
                            key={order.orderId.toString()} // Utiliser l'ID de l'ordre
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

export default OrderList;