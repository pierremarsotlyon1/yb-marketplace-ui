import { Market } from '@/interfaces/Market';
import { Order } from '@/interfaces/Order';
import React from 'react';

// Interface for component props
interface OrderRowProps {
    order: Order;
    market: Market;
    onBuy: () => void;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order, market, onBuy }) => {
    return (
        <div className="grid grid-cols-12 gap-4 items-center px-4 py-4 border-b border-zinc-800 last:border-b-0">
            <div className="col-span-4 font-mono text-sm text-zinc-200">
                {order.amountFormatted}
            </div>
            <div className="col-span-3 font-mono text-sm text-zinc-200">
                {order.premiumFormatted}
            </div>
            <div className="col-span-3 font-mono text-sm text-zinc-200">
                {order.premiumPerSmallestAssetUnitFormatted}
            </div>
            <div className="col-span-2 text-right">
                <button
                    onClick={onBuy}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-8 px-3 py-1
      bg-green-600 text-white
      transition-colors
      hover:bg-green-500"
                >
                    Buy
                </button>
            </div>
        </div>
    );
};