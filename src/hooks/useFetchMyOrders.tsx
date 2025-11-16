"use client"; // Ce hook utilise d'autres hooks client

import { useQueries } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { Address, decodeAbiParameters, encodeAbiParameters, Hex, parseAbiParameters, formatUnits, getAddress } from 'viem';
// Assurez-vous que les chemins relatifs sont corrects
import BatchMyOrderConfig from '../contracts/my-orders/config.json';
import { Order } from '../interfaces/Order';
import { useFetchMarkets } from './useFetchMarkets'; // Réutilise le fetch des marchés
import { marketplaceABI } from '@/abis/marketplaceABI';
import { Market } from '@/interfaces/Market';
import { useMemo } from 'react';
import { MyOrder } from '@/interfaces/MyOrder';

// Taille du lot (chunk size) pour les appels.
const BATCH_SIZE = 200;

/**
 * Fonction helper (non-hook) pour fetcher tous les ordres d'UN marché
 * C'est la logique extraite de 'useFetchAllOrders' pour être réutilisable
 */
const fetchAllOrdersForMarket = async (
    publicClient: any,
    marketplaceAddress: Address,
    marketplaceName: string,
): Promise<MyOrder[]> => {
    if (!publicClient || !marketplaceAddress) {
        return [];
    }

    // 1. Fetch le compte total
    let orderCount: bigint;
    try {
        orderCount = await publicClient.readContract({
            address: marketplaceAddress,
            abi: marketplaceABI,
            functionName: 'orderCounter',
        });
        if (orderCount === 0n) return [];
    } catch (e) {
        console.error(`Failed to fetch order count for ${marketplaceAddress}`, e);
        return []; // Retourne vide pour ce marché
    }

    // 2. Générer les plages (ranges)
    const ranges: { start: bigint; end: bigint }[] = [];
    const total = Number(orderCount);
    for (let i = total - 1; i >= 0; i -= BATCH_SIZE) {
        const startIndex_desc = BigInt(i);
        const endIndex_incl = BigInt(Math.max(0, i - BATCH_SIZE + 1));
        ranges.push({ start: startIndex_desc, end: endIndex_incl });
    }

    if (BatchMyOrderConfig.bytecode === "0x...") {
        console.error("Bytecode missing in contracts/orders/config.json.");
        return [];
    }

    // 3. Préparer tous les appels eth_call
    const promises = ranges.map(range => {
        const inputData = encodeAbiParameters(
            parseAbiParameters(BatchMyOrderConfig.inputType) as any,
            [marketplaceAddress, range.start, range.end]
        );
        const calldata = (BatchMyOrderConfig.bytecode + inputData.slice(2)) as Hex;
        return publicClient.call({ data: calldata });
    });

    try {
        // 4. Exécuter tous les appels en parallèle
        const results = await Promise.all(promises);

        // 5. Décoder et Aplatir les résultats
        const allOrders = results.flatMap(returnedData => {
            if (!returnedData || !returnedData.data) return [];
            try {
                const res = decodeAbiParameters(
                    parseAbiParameters(BatchMyOrderConfig.outputType) as any,
                    returnedData.data as Hex
                );
                return (res[0] as any[]);
            } catch (e) {
                return [];
            }
        });

        // 6. Formater les données
        const orders: MyOrder[] = allOrders.map((order: any) => {

            const crvusdAmount = BigInt(order.underlyingAmountRemaining) * BigInt(order.premiumPerSmallestAssetUnit);
            const amountFormatted = parseFloat(formatUnits(order.yTokenAmountRemaining, 18));

            return {
                marketplace: marketplaceAddress,
                marketplaceName: marketplaceName,
                orderId: order.orderId,
                seller: order.seller,
                yTokenAmountRemaining: order.yTokenAmountRemaining,
                premiumPerSmallestAssetUnit: order.premiumPerSmallestAssetUnit,
                premiumPerSmallestAssetUnitFormatted: parseFloat(formatUnits(order.premiumPerSmallestAssetUnit, 18)),
                isActive: order.isActive,
                amountFormatted: amountFormatted.toFixed(4),
                premiumFormatted: (parseFloat(formatUnits(crvusdAmount, 18))).toFixed(6),
            }
        });

        return orders;

    } catch (error) {
        console.error(`Error fetching all orders for ${marketplaceAddress}:`, error);
        return []; // Retourne vide pour ce marché en cas d'erreur
    }
};

/**
 * Hook principal pour fetcher TOUS les ordres de l'utilisateur
 * sur TOUS les marchés.
 */
export const useFetchMyOrders = () => {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    // 1. Récupérer la liste de tous les marchés
    const { data: markets, isLoading: isLoadingMarkets } = useFetchMarkets();

    // 2. Utiliser 'useQueries' pour lancer un fetch d'ordres pour chaque marché
    const orderQueries = useQueries({
        queries: (markets || []).map((market: Market) => {
            return {
                queryKey: ['fetchAllOrders', market.id], // Clé de query partagée
                queryFn: () => fetchAllOrdersForMarket(publicClient, getAddress(market.id), market.name),
                enabled: !!publicClient && !!market,
                staleTime: 1000 * 60, // 1 minute
            };
        }),
    });

    // 3. Calculer l'état de chargement global
    const isLoading = isLoadingMarkets || orderQueries.some(q => q.isLoading);

    // 4. Agréger et filtrer les résultats
    // useMemo est utilisé pour éviter de recalculer ce filtre à chaque rendu
    const myOrders = useMemo(() => {
        if (isLoading || !isConnected || !address) {
            return [];
        }
        return orderQueries
            .flatMap(query => query.data || []) // Aplatir tous les ordres de tous les marchés
            .filter(order => order.seller.toLowerCase() === address.toLowerCase()); // Filtrer par adresse utilisateur
    }, [isLoading, isConnected, address, orderQueries]);

    return {
        myOrders,
        isLoading,
        isConnected,
    };
};