import { useQuery } from '@tanstack/react-query'; // Modifié (n'utilise plus useInfiniteQuery)
import { usePublicClient } from 'wagmi';
import { Address, decodeAbiParameters, encodeAbiParameters, Hex, parseAbiParameters, formatUnits } from 'viem';
import BatchOrderConfig from '../contracts/orders/config.json';
import { Order } from '../interfaces/Order'; // Assurez-vous que le chemin est correct
import { marketplaceABI } from '@/abis/marketplaceABI';
import { mainnet } from 'viem/chains';
import { readContract } from '@wagmi/core'
import { config } from '@/app/Web3Provider';


/**
 * Étape 1: Hook pour fetch le nombre total d'ordres (orderCounter)
 * Ce hook est appelé une seule fois et met en cache le résultat.
 */
const useGetOrderCount = (marketplaceAddress: Address | undefined) => {
    const publicClient = usePublicClient({ chainId: mainnet.id });

    return useQuery<number, Error>({
        queryKey: ['getOrderCount', marketplaceAddress],
        queryFn: async () => {
            if (!publicClient || !marketplaceAddress) {
                // Ce throw sera attrapé par React Query
                throw new Error("Client or address not ready");
            }

            console.log("toto", marketplaceAddress)
            try {
                const count = await readContract(config, {
                    address: marketplaceAddress,
                    abi: marketplaceABI, // Utilise l'ABI complet
                    functionName: 'orderCounter',
                    chainId: mainnet.id,
                });
                console.log(count, marketplaceAddress)
                return Number(count);
            }
            catch (e) {
                console.log(e)
                return 0;
            }
        },
        enabled: !!publicClient && !!marketplaceAddress,
        staleTime: 1000 * 60, // Rafraîchir le compte total toutes les 60 secondes
    });
};


/**
 * Étape 2: Hook principal pour fetcher TOUS les ordres
 * (N'utilise plus useInfiniteQuery)
 */
export const useFetchPaginatedOrders = (marketplaceAddress: Address | undefined) => {
    const publicClient = usePublicClient({ chainId: mainnet.id });

    // 1. Fetch le nombre total d'ordres
    const { data: orderCount, isLoading: isLoadingCount } = useGetOrderCount(marketplaceAddress);
    console.log(orderCount, isLoadingCount)

    // 2. Utilise un useQuery standard qui dépend de orderCount
    return useQuery<Order[], Error>({
        queryKey: ['fetchAllOrders', marketplaceAddress, orderCount],

        queryFn: async () => {
            // Ne pas fetcher si le compte n'est pas prêt ou s'il n'y a pas d'ordres
            console.log(orderCount)
            if (!publicClient || !marketplaceAddress || orderCount === undefined) {
                return [];
            }

            // 3. Définir la plage complète
            const startIndex_desc = orderCount - 1; // Ex: 99
            const endIndex_incl = 0n;             // Ex: 0

            // 4. Encode constructor arguments
            const inputData = encodeAbiParameters(
                parseAbiParameters(BatchOrderConfig.inputType) as any,
                [marketplaceAddress, startIndex_desc, endIndex_incl]
            );

            // 5. Concatenate bytecode
            if (BatchOrderConfig.bytecode === "0x...") {
                console.error("Bytecode missing in contracts/orders/config.json.");
                return [];
            }
            const calldata = (BatchOrderConfig.bytecode + inputData.slice(2)) as Hex;

            try {
                // 6. Make the single eth_call
                const returnedData = await publicClient.call({
                    data: calldata,
                });

                if (!returnedData || !returnedData.data) {
                    throw new Error("Failed to fetch order data from node.");
                }

                // 7. Decode the return data
                const res = decodeAbiParameters(
                    parseAbiParameters(BatchOrderConfig.outputType) as any,
                    returnedData.data as Hex
                );

                const ordersData = res[0] as any[];

                // 8. Format the data
                const orders: Order[] = ordersData.map((order: any) => ({
                    orderId: order.orderId,
                    seller: order.seller,
                    yTokenAmountRemaining: order.yTokenAmountRemaining,
                    premiumPerSmallestAssetUnit: order.premiumPerSmallestAssetUnit,
                    isActive: order.isActive,
                    amountFormatted: parseFloat(formatUnits(order.yTokenAmountRemaining, 18)).toFixed(4),
                    premiumFormatted: parseFloat(formatUnits(order.premiumPerSmallestAssetUnit, 18)).toFixed(6),
                }));

                return orders;

            } catch (error) {
                console.error("Error fetching all orders:", error);
                return []; // Return empty on error
            }
        },

        // 9. La logique de pagination (getNextPageParam, etc.) est supprimée

        // 10. Activer le hook seulement si orderCount est chargé
        // (isLoadingCount est false quand le fetch initial est terminé)
        enabled: !!marketplaceAddress && !!publicClient && !isLoadingCount,

        staleTime: 1000 * 60, // 1 minute

        // 11. Fournit un tableau vide comme donnée initiale
        initialData: [],
    });
};