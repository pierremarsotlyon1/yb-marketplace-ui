import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { Address, decodeAbiParameters, encodeAbiParameters, Hex, parseAbiParameters, formatUnits, parseEther } from 'viem';
import BatchOrderConfig from '../contracts/orders/config.json';
import { Order } from '../interfaces/Order'; // Assurez-vous que le chemin est correct
import { marketplaceABI } from '@/abis/marketplaceABI';

// Taille du lot (chunk size) pour les appels.
// 200 ordres à la fois est généralement sûr. Ajustez si nécessaire.
const BATCH_SIZE = 200;

/**
 * Étape 1: Hook pour fetch le nombre total d'ordres (orderCounter)
 */
const useGetOrderCount = (marketplaceAddress: Address | undefined) => {
    const publicClient = usePublicClient();

    return useQuery<number, Error>({
        queryKey: ['getOrderCount', marketplaceAddress],
        queryFn: async () => {
            if (!publicClient || !marketplaceAddress) {
                return 0;
            }
            const count = await publicClient.readContract({
                address: marketplaceAddress,
                abi: marketplaceABI,
                functionName: 'orderCounter',
            });
            return Number(count as bigint);
        },
        enabled: !!publicClient && !!marketplaceAddress,
        staleTime: 1000 * 60, // 1 minute
    });
};


/**
 * Étape 2: Hook principal pour fetcher TOUS les ordres par lots (chunks)
 */
export const useFetchAllOrders = (marketplaceAddress: Address | undefined) => {
    const publicClient = usePublicClient();

    // 1. Fetch le nombre total d'ordres
    const { data: orderCount, isLoading: isLoadingCount } = useGetOrderCount(marketplaceAddress);

    return useQuery<Order[], Error>({
        queryKey: ['fetchAllOrders', marketplaceAddress, orderCount],

        queryFn: async () => {
            if (!publicClient || !marketplaceAddress || orderCount === undefined ) {
                return []; 
            }

            // 2. Générer les plages (ranges)
            const ranges: { start: bigint; end: bigint }[] = [];
            const total = Number(orderCount);

            for (let i = total - 1; i >= 0; i -= BATCH_SIZE) {
                const startIndex_desc = BigInt(i);
                const endIndex_incl = BigInt(Math.max(0, i - BATCH_SIZE + 1));
                ranges.push({ start: startIndex_desc, end: endIndex_incl });
            }

            // 3. Préparer tous les appels eth_call
            const promises = ranges.map(range => {
                const inputData = encodeAbiParameters(
                    parseAbiParameters(BatchOrderConfig.inputType) as any,
                    [marketplaceAddress, range.start, range.end]
                );
                const calldata = (BatchOrderConfig.bytecode + inputData.slice(2)) as Hex;
                
                return publicClient.call({ data: calldata });
            });

            try {
                // 4. Exécuter tous les appels en parallèle
                const results = await Promise.all(promises);

                // 5. Décoder et Aplatir les résultats
                const allOrders = results.flatMap(returnedData => {
                    if (!returnedData || !returnedData.data) {
                        return []; // Ignorer le lot en cas d'erreur
                    }
                    try {
                        const res = decodeAbiParameters(
                            parseAbiParameters(BatchOrderConfig.outputType) as any,
                            returnedData.data as Hex
                        );
                        return res[0] as any[]; // Retourne le tableau d'ordres pour ce lot
                    } catch (e) {
                        console.error("Failed to decode batch", e);
                        return [];
                    }
                });

                // 6. Formater les données
                const orders: Order[] = allOrders.map((order: any) => {

                    const crvusdAmount = BigInt(order.underlyingAmountRemaining) * BigInt(order.premiumPerSmallestAssetUnit);                    
                    const amountFormatted = parseFloat(formatUnits(order.yTokenAmountRemaining, 18));
                    const worthUnderlying = parseFloat(formatUnits(BigInt(order.underlyingAmountRemaining), Number(order.underlyingDecimals))) * parseFloat(formatUnits(BigInt(order.underlyingPrice), 18));
                    const premiumFormatted = parseFloat(formatUnits(crvusdAmount, 18));
                    const premiumPerSmallestAssetUnitFormatted = parseFloat(formatUnits(order.premiumPerSmallestAssetUnit, 18));
                    const premium = premiumFormatted * 100 / worthUnderlying;

                    return {
                        orderId: order.orderId,
                        seller: order.seller,
                        yTokenAmountRemaining: order.yTokenAmountRemaining,
                        premiumPerSmallestAssetUnit: order.premiumPerSmallestAssetUnit,
                        premiumPerSmallestAssetUnitFormatted,
                        isActive: order.isActive,
                        amountFormatted: amountFormatted.toFixed(8),
                        premiumFormatted: premiumFormatted,
                        worthUnderlying,
                        premium
                    }
                });

                return orders;

            } catch (error) {
                console.error("Error fetching all orders:", error);
                return []; // Return empty on error
            }
        },

        // 7. Activer le hook seulement si orderCount est chargé
        enabled: !!marketplaceAddress && !!publicClient && !isLoadingCount,
        staleTime: 1000 * 60, // 1 minute
    });
};