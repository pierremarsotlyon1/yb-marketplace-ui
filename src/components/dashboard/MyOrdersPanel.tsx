import React from 'react';
import { Briefcase } from 'lucide-react';

/**
 * MyOrdersPanel Component
 * A new component for the main content area when 'Dashboard' is active.
 */
const MyOrdersPanel = () => {
  // Mock open orders
  const openOrders = [
    { market: 'y-stETH', amount: 1.25, premium: 0.001 },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-zinc-400" />
          My Open Orders
        </h1>
      </div>
      <div className="p-4">
        {openOrders.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            You have no open orders.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-medium text-zinc-400">
              <div>Market</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Premium</div>
            </div>
            {/* Order Rows */}
            {openOrders.map(order => (
              <div key={order.market} className="grid grid-cols-3 gap-4 items-center px-4 py-3 rounded-lg bg-zinc-900">
                <div className="font-medium text-zinc-200">
                  {order.market}
                </div>
                <div className="font-mono text-sm text-zinc-300 text-right">
                  {order.amount}
                </div>
                <div className="font-mono text-sm text-zinc-300 text-right">
                  {order.premium} crvUSD
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPanel;