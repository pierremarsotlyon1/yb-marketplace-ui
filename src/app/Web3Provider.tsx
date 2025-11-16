"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { getRpcUrl } from "@/utils/rpc";

export const config = createConfig(
    getDefaultConfig({
        chains: [mainnet],
        transports: {
            [mainnet.id]: http(
                "https://virtual.mainnet.eu.rpc.tenderly.co/f76cfa30-c063-497a-8eb1-15dbc0ea3dd0"
                //getRpcUrl(mainnet.id),
            ),
        },

        // Required API Keys
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

        // Required App Info
        appName: "YBMarketplace",

        // Optional App Info
        appDescription: "YBMarketplace",
        appUrl: "https://yb-marketplace.com/", // your app's url
        appIcon: "https://yb-marketplace.com/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
    }),
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: false,
            staleTime: 1000 * 60 * 60 * 24, // 24 hours
        },
    },
});

export const Web3Provider = ({ children }: { children: ReactNode }) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>
                    {children}
                    <Analytics />
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};