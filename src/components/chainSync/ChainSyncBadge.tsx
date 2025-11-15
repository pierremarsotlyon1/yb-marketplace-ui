// components/ChainSyncBadge.tsx
import Image from "next/image";

export interface ChainSyncInfo {
  chainId: number;
  name: string;
  logo: string;
  lastBlock: number;
}

export function ChainSyncBadge({ chain }: { chain: ChainSyncInfo }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs shadow-sm">
      <Image
        src={chain.logo}
        alt={chain.name}
        width={16}
        height={16}
        className="rounded-full"
      />
      <span className="font-medium">{chain.name}</span>
      <span className="text-gray-500">#{chain.lastBlock.toLocaleString()}</span>
    </div>
  );
}