
import { chunk, uniq } from 'lodash-es';
import { Address } from 'viem';

const LLAMA_API_URL = 'https://coins.llama.fi'

export type Price = {
    chainId: number
    address: Address
    usdPrice: number
}

export const getPricesFromLlama = async (tokens: Address[], chainId = 1, defaultErrorValue?: any): Promise<Price[]> => {
    if (tokens.length > 0) {
        try {
            const prefix: string = getLlamaTokenPrefix(chainId)

            const httpArgs = uniq(tokens.map((t) => `${prefix}:${t}`)).toString()
            const httpRequest = await (await fetch(`${LLAMA_API_URL}/prices/current/${httpArgs}`)).json()
            const coinsData = httpRequest.coins

            const parsedPrice = tokens.map((t) => {
                return {
                    chainId,
                    address: t,
                    usdPrice: coinsData[`${prefix}:${t}`] ? coinsData[`${prefix}:${t}`].price : 0,
                }
            })

            return parsedPrice
        } catch (e) {
            console.error(e)
            return defaultErrorValue
        }
    }

    return []
}

export const getLlamaTokenPrefix = (chainId = 1): string => {
    switch (chainId) {
        case 1:
            return 'ethereum'
        case 137:
            return 'polygon'
        case 252:
            return 'fraxtal'
        case 8453:
            return 'base'
        case 42161:
            return 'arbitrum'
        case 56:
            return 'bsc'
        case 59144:
            return 'linea'
        default:
            return 'ethereum'
    }
}