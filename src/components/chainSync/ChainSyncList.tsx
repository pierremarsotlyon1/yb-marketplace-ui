// components/ChainSyncList.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { ChainSyncBadge, ChainSyncInfo } from "./ChainSyncBadge";
import { apiQuery } from "@/utils/graphql";
import { chainNames } from "@/utils/chains";

export function ChainSyncList() {
    const { data, isLoading } = useQuery({
        queryKey: ["chain-sync-status"],
        queryFn: async () => {
            const json = await apiQuery(`
                query {
                    chain_metadata {
                        chain_id
                        latest_processed_block
                    }
                }
            `);

            const chainLogos: Record<number, { name: string; logo: string }> = {
                1: {
                    name: "Ethereum",
                    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
                },
                42161: {
                    name: "Arbitrum",
                    logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg",
                },
            };

            return json.chain_metadata.map((c: any) => ({
                chainId: c.chain_id,
                name: chainLogos[c.chain_id]?.name || `Chain ${c.chain_id}`,
                logo: `https://icons.llamao.fi/icons/chains/rsz_${chainNames[c.chain_id]}.jpg`,
                lastBlock: c.latest_processed_block,
            })) as ChainSyncInfo[];
        },
    });

    if (isLoading) {
        return <div className="flex gap-2">Loading...</div>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {data?.map((chain) => (
                <ChainSyncBadge key={chain.chainId} chain={chain} />
            ))}
        </div>
    );
}