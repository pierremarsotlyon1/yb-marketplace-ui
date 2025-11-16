"use client"; // Le hook 'useAccount' l'exige
import React from 'react';
import { Briefcase, Wallet, Loader2 } from 'lucide-react';
// Assurez-vous que les chemins sont corrects
import { Order } from '@/interfaces/Order';
import { useFetchMyOrders } from '@/hooks/useFetchMyOrders';
// Import du nouveau hook pour annuler
import { useCancelOrder } from '@/hooks/useCancelOrder';
import { MyOrder } from '@/interfaces/MyOrder';
import { formatUsd } from '@/utils/money';

/**
 * MyOrdersPanel Component
 * Affiche les ordres de l'utilisateur connecté
 */
const MyOrdersPanel: React.FC = () => {
  // 1. Utiliser le nouveau hook
  const { myOrders, isLoading, isConnected } = useFetchMyOrders();

  // 2. Initialiser le hook d'annulation
  const { cancelOrder, isPending: isCancelling, cancellingOrderId } = useCancelOrder();

  // 3. Gérer l'état "non connecté"
  if (!isConnected) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-zinc-400" />
            My Orders
          </h1>
        </div>
        <div className="p-4 text-center text-zinc-500 py-8">
          <Wallet className="h-8 w-8 mx-auto mb-2" />
          Please connect your wallet to view your orders.
        </div>
      </div>
    );
  }

  // 4. Gérer l'état "chargement"
  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-zinc-400" />
            My Orders
          </h1>
        </div>
        <div className="p-4 text-center text-zinc-400 py-8">
          Loading your orders across all markets...
        </div>
      </div>
    );
  }

  // 5. Gérer l'état "connecté et chargé"
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-zinc-400" />
          My Orders
        </h1>
      </div>
      <div className="p-4">
        {myOrders.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            You have no orders on any market.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Table Header - Ajout d'une 5ème colonne */}
            <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium text-zinc-400">
              <div>Order ID</div>
              <div className="text-right">Market</div>
              <div className="text-right">Amount Remaining</div>
              <div className="text-right">Amount (crvUSD)</div>
              <div className="text-right">Action</div>
            </div>
            {/* Order Rows - Ajout d'une 5ème colonne */}
            {myOrders.map((order: MyOrder) => (
              <div
                key={order.orderId.toString()}
                className="grid grid-cols-5 gap-4 items-center px-4 py-3 rounded-lg bg-zinc-900"
              >
                <div className="font-mono text-sm text-zinc-300">
                  #{order.orderId.toString()}
                </div>
                <div className="font-mono text-sm text-zinc-300 text-right">
                  {order.marketplaceName}
                </div>
                <div className="font-mono text-sm text-zinc-300 text-right">
                  {order.amountFormatted}
                </div>
                <div className="font-mono text-sm text-zinc-300 text-right">
                  {formatUsd(order.premiumFormatted, 0, 2)}
                </div>
                <div className="text-right">
                  {order.isActive ? (
                    <button
                      onClick={() => cancelOrder(order.marketplace, order.orderId)}
                      disabled={isCancelling}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium h-7 px-3 py-1
                      bg-red-600 text-white
                      transition-colors
                      hover:bg-red-500
                      disabled:bg-zinc-700 disabled:opacity-50"
                    >
                      {isCancelling && cancellingOrderId === order.orderId ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Cancel
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-700 text-zinc-300">
                      Done
                    </span>
                  )}
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