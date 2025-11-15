import { arbitrum, aurora, avalanche, base, bsc, celo, fantom, fraxtal, gnosis, kava, mainnet, moonbeam, optimism, polygon, sonic, xLayer } from "viem/chains";

export const CRV_IMAGE = "https://cdn.jsdelivr.net/gh/curvefi/curve-assets/images/assets/0xd533a949740bb3306d119cc777fa900ba034cd52.png";

export const getCurveImageLink = (tokenAddress: `0x${string}`, chainId: number): string => {
    const offset = chainOffset(chainId);
    return `https://cdn.jsdelivr.net/gh/curvefi/curve-assets/images/assets${offset.length > 0 ? `-${offset}` : ''}/${tokenAddress.toLowerCase()}.png`;
}

const chainOffset = (chainId: number): string => {
    switch (chainId) {
        case mainnet.id:
            return "";
        case arbitrum.id:
            return "arbitrum";
        case polygon.id:
            return "polygon";
        case fantom.id:
            return "fantom";
        case avalanche.id:
            return "avalanche";
        case optimism.id:
            return "optimism";
        case gnosis.id:
            return "xdai";
        case aurora.id:
            return "aurora";
        case moonbeam.id:
            return "moonbeam";
        case kava.id:
            return "kava";
        case celo.id:
            return "celo";
        case base.id:
            return "base";
        case fraxtal.id:
            return "fraxtal";
        case bsc.id:
            return "bsc";
        case xLayer.id:
            return "x-layer";
        case sonic.id:
            return "sonic";
        default:
            return "";
    }
}