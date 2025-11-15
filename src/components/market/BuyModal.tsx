import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Order } from '@/interfaces/Order';
import { Market } from '@/interfaces/Market';

// Interface for component props
interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  market: Market | null;
}

/**
 * BuyModal Component
 * Modal for confirming a partial or full buy.
 */
export const BuyModal: React.FC<BuyModalProps> = ({ isOpen, onClose, order, market }) => {
  if (!isOpen || !order || !market) return null; // Ensure order and market exist

  const [buyAmount, setBuyAmount] = useState<string>('');
  
  // Calculate costs safely
  const amountToBuy = parseFloat(buyAmount) || 0;
  const assetCost = (amountToBuy * 0.9).toFixed(5); // Mock cost
  const premiumCost = (amountToBuy * order.premium).toFixed(4); // Mock cost

  const handleBuyPartial = () => {
    console.log(`Buying ${buyAmount} of ${market.name}`);
    // ... call buyOrder(order.id, buyAmount)
    onClose();
  };
  
  const handleBuyFull = () => {
    console.log(`Buying FULL order ${order.id} of ${market.name}`);
    // ... call buyFullOrder(order.id)
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-zinc-500 rounded-full hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-4">
          Buy {market.name}
        </h2>
        
        <div className="space-y-4">
          {/* Order Info */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Available Amount</span>
              <span className="font-mono text-zinc-200">{order.amount} {market.name}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-400">Premium</span>
              <span className="font-mono text-zinc-200">{order.premium} crvUSD / unit</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-400">Seller</span>
              <span className="font-mono text-zinc-200">{order.seller}</span>
            </div>
          </div>

          {/* Partial Buy Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-1">
              Amount to Buy
            </label>
            <input
              type="text"
              name="amount"
              id="amount"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder={`Max: ${order.amount}`}
              className="w-full h-10 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white
                         font-mono text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Cost Summary */}
          <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Underlying Asset Cost</span>
              <span className="font-mono text-zinc-200">{assetCost} WBTC</span>
            </div>
            <div className="flex justify-between text-sm">

              <span className="text-zinc-400">Premium Cost</span>
              <span className="font-mono text-zinc-200">{premiumCost} crvUSD</span>
            </div>
            <div className="border-t border-zinc-700 my-2"></div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-zinc-200">Total Cost (Premium)</span>
              <span className="font-mono text-blue-400">{premiumCost} crvUSD</span>
            </div>
      </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleBuyPartial}
              disabled={!buyAmount || parseFloat(buyAmount) === 0}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2
              bg-blue-600 text-white
              transition-colors
              hover:bg-blue-500
              disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              Buy Partial Amount
            </button>
            <button
              onClick={handleBuyFull}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2
              bg-green-600 text-white
              transition-colors
              hover:bg-green-500"
            >
              Buy Full Order <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
