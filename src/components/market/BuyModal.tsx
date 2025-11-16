import React from 'react';
import { X, ArrowRight, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Order } from '@/interfaces/Order';
import { Market } from '@/interfaces/Market';
import { useBuyOrder } from '../../hooks/useBuyOrder'; // Assurez-vous que le chemin est correct
import { formatEther, formatUnits, parseEther } from 'viem';

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
  const {
    buyAmount,
    setBuyAmount,
    handleSetMax,
    handleSubmit,
    stableBalance,
    assetBalance,
    assetCost,
    stableCost,
    isLoadingCost,
    isAmountValid,
    hasError,
    hasInsufficientStable,
    hasInsufficientAsset,
    needsStableApproval,
    needsAssetApproval,
    isWorking,
    isBuying,
    isApprovingAsset,
    isApprovingStable,
    buyStatus,
    approveAssetStatus,
    approveStableStatus,
  } = useBuyOrder({ market, order, isOpen });

  if (!isOpen || !order || !market) return null;

  // Déterminer l'état du bouton principal
  let submitButtonText = "Buy";
  let submitButtonIcon:  React.JSX.Element | undefined = undefined;
  let isSubmitDisabled = !isAmountValid || hasError || isWorking || isLoadingCost;

  if (isApprovingStable || approveStableStatus === 'pending') {
    submitButtonText = isApprovingStable ? "Approving crvUSD..." : "Approve crvUSD";
    submitButtonIcon = isApprovingStable ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : undefined;
  } else if (isApprovingAsset || approveAssetStatus === 'pending') {
    submitButtonText = isApprovingAsset ? "Approving Asset..." : "Approve Asset";
    submitButtonIcon = isApprovingAsset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : undefined;
  } else if (isBuying || buyStatus === 'pending') {
    submitButtonText = isBuying ? "Processing..." : "Confirm Buy";
    submitButtonIcon = <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  } else if (needsStableApproval) {
    submitButtonText = "Approve crvUSD";
    isSubmitDisabled = isWorking || !isAmountValid;
  } else if (needsAssetApproval) {
    submitButtonText = "Approve Asset";
    isSubmitDisabled = isWorking || !isAmountValid;
  } else {
    // Cas d'achat final
    submitButtonText = isAmountValid && parseEther(buyAmount) === order.yTokenAmountRemaining ? "Buy Full Order" : "Buy Partial Amount";
  }
  
  const formattedOrderAmount = order ? formatEther(order.yTokenAmountRemaining) : '0';

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
              <span className="font-mono text-zinc-200">{formattedOrderAmount} {market.name}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-400">Premium</span>
              <span className="font-mono text-zinc-200">{formatEther(order.premiumPerSmallestAssetUnit)} crvUSD / unit</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-400">Seller</span>
              <span className="font-mono text-zinc-200">{order.seller}</span>
            </div>
          </div>

          {/* Partial Buy Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="amount" className="block text-sm font-medium text-zinc-300">
                Amount to Buy
              </label>
              <button 
                onClick={handleSetMax}
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Max
              </button>
            </div>
            <input
              type="text"
              name="amount"
              id="amount"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder={`Max: ${formattedOrderAmount}`}
              className={`w-full h-10 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white
                         font-mono text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         ${(buyAmount && !isAmountValid) ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
          </div>
          
          {/* Cost Summary */}
          <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
            {/* Asset Cost */}
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Underlying Asset Cost</span>
              <span className="font-mono text-zinc-200">
                {isLoadingCost ? "..." : formatUnits(assetCost, assetBalance?.decimals || 18)} {assetBalance?.symbol || 'ASSET'}
              </span>
            </div>
            {/* Asset Balance Check */}
            {assetBalance && (
              <div className="flex justify-between text-xs -mt-1 text-zinc-500">
                <span>Your Balance: {assetBalance.formatted} {assetBalance.symbol}</span>
                {hasInsufficientAsset && <span className="text-red-400">Insufficient Balance</span>}
              </div>
            )}
            
            {/* Premium Cost */}
            <div className="flex justify-between text-sm pt-2">
              <span className="text-zinc-400">Premium Cost (crvUSD)</span>
              <span className="font-mono text-zinc-200">
                {isLoadingCost ? "..." : formatEther(stableCost)} crvUSD
              </span>
            </div>
            {/* Stable Balance Check */}
            {stableBalance && (
              <div className="flex justify-between text-xs -mt-1 text-zinc-500">
                <span>Your Balance: {stableBalance.formatted} crvUSD</span>
                {hasInsufficientStable && <span className="text-red-400">Insufficient Balance</span>}
              </div>
            )}

            <div className="border-t border-zinc-700 my-2"></div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-zinc-200">Total Cost (Premium)</span>
              <span className="font-mono text-blue-400">
                {isLoadingCost ? "..." : formatEther(stableCost)} crvUSD
              </span>
            </div>
          </div>

          {/* Action Button (Unique) */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2
              bg-green-600 text-white
              transition-colors
              hover:bg-green-500
              disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {submitButtonIcon}
              {submitButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};