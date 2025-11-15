import React from 'react';
import { MarketRow } from './MarketRow';
import { Market } from '@/interfaces/Market';
import { useFetchMarkets } from '@/hooks/useFetchMarkets';

// Interface for component props
interface MarketListProps {
}

/**
 * MarketList Component
 * The main content area showing available markets (orders).
 */
export const MarketList: React.FC<MarketListProps> = () => {
  const {data: markets} = useFetchMarkets()

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/20">
      {/* List Header */}
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold text-white">Select Market</h1>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-zinc-800 text-xs font-medium text-zinc-400">
        <div className="col-span-5">Asset</div>
        <div className="col-span-3 text-right">Total Value Locked</div>
        <div className="col-span-4 text-right">Best Premium</div>
      </div>

      {/* Market Rows */}
      <div className="flex flex-col">
        {markets?.map((market) => (
          <MarketRow 
            key={market.id} 
            market={market} 
          />
        ))}
      </div>
    </div>
  );
};