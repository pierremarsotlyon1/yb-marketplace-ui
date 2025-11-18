"use client";

import React, { useMemo, useState } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import { useFetchMarkets } from '../../hooks/useFetchMarkets';
import { useCreateOrder } from '../../hooks/useCreateOrder';
import { Market } from '../../interfaces/Market';
import { formatEther, parseEther } from 'viem';

const FEE_PERCENT = 5n;

/**
 * Panel component for creating a new sell order.
 */
export const CreateOrderPanel: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  
  const { data: markets, isLoading: isLoadingMarkets, isSuccess: marketsLoaded } = useFetchMarkets();

  const {
    amount,
    setAmount,
    totalPrice, // Nouveau
    setTotalPrice, // Nouveau
    balance, // Nouveau
    hasInsufficientBalance, // Nouveau
    needsApproval,
    handleApprove,
    handleCreateOrder,
    amountIsValid,
    priceIsValid, // Nouveau
    isLoadingPreview, // Nouveau
    premiumDisplay, // Nouveau
    calculationError, // Nouveau
    isApproving,
    isCreatingOrder,
    approveStatus,
    createOrderStatus,
  } = useCreateOrder({ selectedMarket });

  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const marketId = e.target.value;
    const market = markets?.find(m => m.id === marketId) || null;
    setSelectedMarket(market);
    // Les inputs sont maintenant réinitialisés via useEffect dans le hook
  };

  const handleSetMaxAmount = () => {
    if (balance) {
      setAmount(balance.formatted);
    }
  };

  // Calculate net amount received (for display only)
  const receivedAmountDisplay = useMemo(() => {
    try {
        if (priceIsValid && totalPrice) {
            const priceWei = parseEther(totalPrice);
            const fee = (priceWei * FEE_PERCENT) / 100n;
            const received = priceWei - fee;
            return formatEther(received);
        }
        return "0";
    } catch (e) {
        return "0";
    }
  }, [priceIsValid, totalPrice]);
    

  const isWorking = isApproving || isCreatingOrder || isLoadingPreview;

  // Logique de désactivation mise à jour
  const isSubmitDisabled = !selectedMarket || !amountIsValid || !priceIsValid || isWorking || needsApproval || hasInsufficientBalance || !!calculationError;
  const isApproveDisabled = !selectedMarket || !amountIsValid || isWorking || !needsApproval || hasInsufficientBalance;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-zinc-400" />
          Create New Sell Order
        </h1>
      </div>
      
      <div className="p-4 space-y-4">
        {/* 1. Market Selector */}
        <div>
          <label htmlFor="market" className="block text-sm font-medium text-zinc-300 mb-1">
            Market (yToken to sell)
          </label>
          <select
            id="market"
            value={selectedMarket?.id || ""}
            onChange={handleMarketChange}
            disabled={isLoadingMarkets || isWorking}
            className="w-full h-10 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white
                       font-sans text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50"
          >
            <option value="">{isLoadingMarkets ? "Loading markets..." : "Select a market"}</option>
            {marketsLoaded && markets.map(market => (
              <option key={market.id} value={market.id}>
                {market.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Amount Input (Mis à jour) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="amount" className="block text-sm font-medium text-zinc-300">
              Amount to Sell
            </label>
            {/* Affichage de la balance et bouton Max */}
            {balance && (
              <button 
                onClick={handleSetMaxAmount}
                disabled={!selectedMarket}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </button>
            )}
          </div>
          <input
            type="text"
            name="amount"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 10.5"
            disabled={!selectedMarket || isWorking}
            className={`w-full h-10 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white
                       font-mono text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50
                       ${(amount && !amountIsValid) ? 'border-red-500 focus:ring-red-500' : ''}
                       ${hasInsufficientBalance ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          {/* Messages d'erreur */}
          {(amount && !amountIsValid) && (
              <p className="text-xs text-red-400 mt-1">Invalid amount. Please enter a number.</p>
          )}
          {hasInsufficientBalance && (
              <p className="text-xs text-red-400 mt-1">Insufficient balance.</p>
          )}
        </div>

        {/* 3. Total Price Input (Ancien Premium Input) */}
        <div>
          <label htmlFor="totalPrice" className="block text-sm font-medium text-zinc-300 mb-1">
            Total Sell Price (in crvUSD)
          </label>
          <input
            type="text"
            name="totalPrice"
            id="totalPrice"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            placeholder="e.g., 10000"
            disabled={!selectedMarket || isWorking}
            className={`w-full h-10 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white
                       font-mono text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50
                       ${(totalPrice && !priceIsValid) ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
           {(totalPrice && !priceIsValid) ? (
              <p className="text-xs text-red-400 mt-1">Invalid price. Please enter a number.</p>
          ) : (
             // Fee Information Message
             priceIsValid && (
                 <p className="text-xs text-zinc-400 mt-1 bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
                     <span className="text-yellow-500 font-medium">5% protocol fee applies.</span> 
                     {" "}You will receive <span className="text-white font-mono font-bold">{parseFloat(receivedAmountDisplay).toFixed(2)} crvUSD</span>.
                 </p>
             )
          )}
        </div>

        {/* 5. Action Buttons (Approve or Create) */}
        <div className="flex gap-4 pt-2">
          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isApproveDisabled || hasInsufficientBalance}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2
              bg-green-600 text-white
              transition-colors
              hover:bg-green-500
              disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isApproving ? "Approving..." : (approveStatus === 'pending' ? "Waiting..." : "Approve")}
            </button>
          ) : (
            <button
              onClick={handleCreateOrder}
              disabled={isSubmitDisabled}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2
              bg-green-600 text-white
              transition-colors
              hover:bg-green-500
              disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isCreatingOrder ? "Creating..." : (createOrderStatus === 'pending' ? "Waiting..." : "Create Order")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};