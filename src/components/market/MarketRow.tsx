import React, { useMemo } from 'react';
import { ArrowRight } from "lucide-react";
import { Market } from '@/interfaces/Market';
import Link from 'next/link';
import { useFetchAllOrders } from '@/hooks/useFetchPaginatedOrders';
import { formatUnits, getAddress } from 'viem';

// Interface for component props
interface MarketRowProps {
  market: Market;
}

export const MarketRow: React.FC<MarketRowProps> = ({ market }) => {

  const { data: orders } = useFetchAllOrders(getAddress(market.id));

  const bestPremium = useMemo(() => {
    if (!orders || orders.length === 0) {
      return "-"; // Message par défaut si pas d'ordres
    }

    // 1. Trouver le premium (BigInt) le plus bas
    const minPremium = orders.reduce((min, order) => {
      return order.premiumPerSmallestAssetUnit < min
        ? order.premiumPerSmallestAssetUnit
        : min;
    }, orders[0].premiumPerSmallestAssetUnit); // Initialiser avec le premier

    // 2. Formater pour l'affichage
    const formattedPremium = parseFloat(formatUnits(minPremium, 18)).toFixed(6);

    return `${formattedPremium} crvUSD / unit`;
  }, [orders]);

  return (
    <Link
      href={`/market/${market.id}`}
      className="grid grid-cols-12 gap-4 items-center px-4 py-4 border-b border-zinc-800 last:border-b-0 
                 hover:bg-zinc-800/50 transition-colors text-left w-full group"
    >
      <div className="col-span-5 flex items-center gap-3">
        <img src={market.iconUrl} alt={market.name} className="h-8 w-8 rounded-full" />
        <span className="font-medium text-white">{market.name}</span>
      </div>
      <div className="col-span-3 text-right font-mono text-sm text-zinc-300">
        {market.tvl}
      </div>
      <div className="col-span-4 text-right font-mono text-sm text-blue-400 flex items-center justify-end gap-2">
        {bestPremium}
        <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};