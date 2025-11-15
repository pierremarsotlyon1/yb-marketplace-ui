const baseUrls: Record<number, string> = {
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    137: "https://polygonscan.com",
    42161: "https://arbiscan.io",
    42170: "https://nova.arbiscan.io",
    10: "https://optimistic.etherscan.io",
    8453: "https://basescan.org",
    56: "https://bscscan.com",
    43114: "https://snowtrace.io",
    250: "https://ftmscan.com",
    100: "https://gnosisscan.io",
    324: "https://explorer.zksync.io",
    59144: "https://lineascan.build",
    534352: "https://scrollscan.com",
    81457: "https://blastscan.io",
};

/**
 * Retourne le lien vers l'explorer principal d'une chaîne pour une adresse donnée.
 * @param chainId EVM chain id (ex: 1, 137, 42161…)
 * @param address Adresse EVM (0x...)
 * @returns URL complète ou null si non géré
 */
export function getExplorerAddressLink(chainId: number, address: string): string {
    return getExplorerLink(chainId, address, 'address');
}

export function getExplorerTxLink(chainId: number, hash: string): string {
    return getExplorerLink(chainId, hash, 'tx');
}

export function getExplorerBlockLink(chainId: number, block: number): string {
    return getExplorerLink(chainId, block, 'block');
}

function getExplorerLink(chainId: number, address: string | number, type: 'tx' | 'address' | 'block'): string {
    const base = baseUrls[chainId];
    if (!base) return "";

    return `${base}/${type}/${address}`;
}