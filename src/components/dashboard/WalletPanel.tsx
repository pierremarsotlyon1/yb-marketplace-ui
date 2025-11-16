"use client"; // Ce composant utilise des hooks
import React, { useMemo } from 'react';
import { CircleDollarSign, Wallet, Loader2 } from 'lucide-react';
// CORRECTIF: Importation de useReadContracts
import { useAccount, useReadContracts } from 'wagmi'; 
import { Address, erc20Abi, formatUnits } from 'viem';

// --- CORRECTIF: Chemins relatifs pour les imports ---
import { useFetchMarkets } from '../../hooks/useFetchMarkets';
import { CRVUSD_ADDRESS } from '@/utils/contracts';

// Interface for WalletBalance props
interface WalletBalanceProps {
  asset: string;
  amount: string;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ asset, amount }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-zinc-400">{asset}</span>
    <span className="font-mono text-zinc-200">{amount}</span>
  </div>
);

/**
 * WalletPanel Component
 * Affiche dynamiquement les balances de l'utilisateur en utilisant useReadContracts.
 */
const WalletPanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: markets, isLoading: isLoadingMarkets } = useFetchMarkets();

  // 1. Créer la liste des tokens à fetch
  const tokensToFetch = useMemo(() => {
    if (isLoadingMarkets || !markets || markets.length === 0) {
      return [CRVUSD_ADDRESS]; // Fetch au moins crvUSD
    }
    
    // Obtenir toutes les adresses yToken des marchés
    const yTokenAddresses = markets.map(market => market.ybAddress as Address);
    
    // Ajouter crvUSD et s'assurer qu'il n'y a pas de doublons
    return [...new Set([CRVUSD_ADDRESS, ...yTokenAddresses])];
  }, [markets, isLoadingMarkets]);

  // 2. Construire le tableau de contrats pour useReadContracts
  const contracts = useMemo(() => {
    if (!address || tokensToFetch.length === 0) return [];

    // Crée un 'batch' d'appels : [balanceOf(tokenA), symbol(tokenA), decimals(tokenA), balanceOf(tokenB), ...]
    return tokensToFetch.flatMap(tokenAddress => [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      }
    ]);
  }, [tokensToFetch, address]);

  // 3. Fetcher toutes les balances, symboles, et décimales en un seul appel batch
  const { data: multicallData, isLoading: isLoadingBalances } = useReadContracts({
    contracts: contracts,
    query: {
      enabled: isConnected && contracts.length > 0,
      refetchInterval: 15000, 
    }
  });

  // 4. Traiter les résultats
  const processedBalances = useMemo(() => {
    if (!multicallData || multicallData.length === 0) return [];

    const balances: WalletBalanceProps[] = [];
    
    // Itérer à travers les résultats 3 par 3 (balance, symbol, decimals)
    for (let i = 0; i < multicallData.length; i += 3) {
      const balanceRes = multicallData[i];
      const symbolRes = multicallData[i + 1];
      const decimalsRes = multicallData[i + 2];

      // Vérifier que tous les appels ont réussi et que la balance n'est pas nulle
      if (balanceRes.status === 'success' && 
          symbolRes.status === 'success' && 
          decimalsRes.status === 'success' &&
          (balanceRes.result as bigint) > 0n) { // On affiche que les balances non nulles
        
        balances.push({
          asset: symbolRes.result as string,
          amount: parseFloat(formatUnits(
            balanceRes.result as bigint, 
            decimalsRes.result as number
          )).toFixed(4),
        });
      }
    }
    return balances;
  }, [multicallData]);

  const isLoading = isLoadingMarkets || (isConnected && isLoadingBalances);

  return (
    <div className="flex flex-col gap-6 sticky top-24">
      {/* My Wallet Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <CircleDollarSign className="h-5 w-5 text-zinc-400" />
            My Wallet
          </h2>
        </div>
        <div className="p-4 flex flex-col gap-3 min-h-[120px]">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center text-center text-zinc-500 py-4">
              <Wallet className="h-6 w-6 mb-2" />
              <span className="text-sm">Please connect your wallet</span>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center text-zinc-400 text-sm py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading balances...
            </div>
          ) : (processedBalances && processedBalances.length > 0) ? (
            processedBalances.map(bal => (
              <WalletBalance 
                key={bal.asset} 
                asset={bal.asset} 
                amount={bal.amount} 
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500 text-center py-4">
              No balances found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPanel;