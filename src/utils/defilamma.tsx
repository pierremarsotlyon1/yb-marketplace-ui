import axios from "axios";
import { chunk } from "lodash";
import { arbitrum, mainnet, sonic } from "viem/chains";

export const getTokenPrices = async (tokenPrices: string[], chainId: number): Promise<Record<string, number>> => {

    const responses: any = {};
    let chainName = "";
    switch (chainId) {
        case mainnet.id:
            chainName = "ethereum";
            break;
        case arbitrum.id:
            chainName = "arbitrum";
            break;
        case sonic.id:
            chainName = "sonic";
            break;
        default:
            chainName = "ethereum";
            break;
    }

    const chunks = chunk(tokenPrices, 20);
    for (const arr of chunks) {

        const str = arr.map((addr: string) => {
            if (addr.indexOf(":") === -1) {
                return chainName + ":" + addr;
            }

            return addr;
        }).join(",");

        const { data: response } = await axios.get(`https://coins.llama.fi/prices/current/${str}`);
        if (response["coins"]) {
            const coins = response["coins"];
            const keys = Object.keys(coins);
            for (const key of keys) {
                const tokenRewardAddress = key.split(":")[1].toLowerCase();
                const tokenPrice = coins[key].price;

                responses[tokenRewardAddress] = tokenPrice;
            }
        }
    }

    return responses;
}

export const getTokenPriceWithCoinTerminal = async (tokenAddress: string, chainName: string): Promise<number> => {
    try {
        const resp = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${chainName}/tokens/${tokenAddress}?include=top_pools`);
        if (!resp.data.data.attributes.price_usd) {
            return 0;
        }

        return parseFloat(resp.data.data.attributes.price_usd);
    }
    catch (e) {
        return 0;
    }
}

export const getBlockNumberByTimestamp = async (chain: string, timestamp: number): Promise<number> => {
    const { data: response } = await axios.get(`https://coins.llama.fi/block/${chain}/${timestamp}`);
    return response.height || 0;
}