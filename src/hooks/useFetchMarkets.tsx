import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi'; // Import correct de Wagmi
import { Market } from '../interfaces/Market';
import { decodeAbiParameters, encodeAbiParameters, formatUnits, Hex, parseAbiParameters } from 'viem';
import BatchMarketConfig from '../contracts/markets/config.json';
import { MARKETPLACE_FACTORY_ADDRESS } from '@/utils/contracts';
import { mainnet } from 'viem/chains';
import { getCurveImageLink } from '@/utils/curveImages';

/**
 * Fetches all deployed markets and their associated yToken data
 * using the off-chain/constructor-call pattern.
 */
export const useFetchMarkets = () => {
    // 1. Get the public client from Wagmi
    const publicClient = usePublicClient({ chainId: mainnet.id });

    return useQuery<Market[], Error>({
        queryKey: ['fetchMarkets', publicClient?.chain.id],
        queryFn: async () => {
            try {

                // 2. Assurez-vous que le client est disponible
                if (!publicClient) {
                    return [];
                }
                // 3. Encode the constructor argument (the factory address)
                const inputData = encodeAbiParameters(
                    parseAbiParameters(BatchMarketConfig.inputType) as any,
                    [MARKETPLACE_FACTORY_ADDRESS]
                );

                // 4. Concatenate bytecode + encoded arguments
                if (BatchMarketConfig.bytecode === "0x...") {
                    return [];
                }
                const calldata = (BatchMarketConfig.bytecode + inputData.slice(2)) as Hex;

                // 5. Make the eth_call using the publicClient
                const returnedData = await publicClient.call({
                    data: calldata,
                });

                if (!returnedData || !returnedData.data) {
                    return [];
                }

                // 6. Decode the ABI-encoded return data
                const res = decodeAbiParameters(
                    parseAbiParameters(BatchMarketConfig.outputType) as any,
                    returnedData.data as Hex
                );

                // 7. Get the first element, which is our array
                const marketsData = res[0] as any[];

                // 8. Format the data to match the UI's 'Market' interface
                const markets: Market[] = marketsData.map((market: any) => {

                    const pricePerShare = parseFloat(formatUnits(BigInt(market.pricePerShare), 18));
                    const marketBalance = parseFloat(formatUnits(BigInt(market.factoryBalance), 18));
                    const oraclePrice = parseFloat(formatUnits(BigInt(market.oraclePrice), 18));

                    return {
                        id: market.yTokenAddress, // Use yToken address as the unique ID
                        name: market.symbol,
                        iconUrl: getCurveImageLink(market.assetToken, mainnet.id),

                        // TVL and BestPremium are not fetched by this contract.
                        // We will mock them for now.
                        tvl: (marketBalance * oraclePrice * pricePerShare).toFixed(4),
                        bestPremium: `${(Math.random() * 0.002).toFixed(4)} crvUSD / unit`,
                    };
                });
                
                return markets;
            }
            catch (e) {
                console.log(e)
                return []
            }
        },
        // Cache the data for 5 minutes
        staleTime: 1000 * 60 * 5,
        // 9. Only run the query if the publicClient is available
        enabled: !!publicClient,
    });
};