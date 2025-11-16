// src/reader.ts
import { Chain, createPublicClient, http, type Abi, type Address } from "viem";
import { arbitrum, mainnet } from "viem/chains";

export type RpcMap = Record<string, string>; // { mainnet: "...", arbitrum: "..." }

export type Call = {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: any[];
};

const CHAINS: Chain[] = [mainnet, arbitrum];
const CHAINS_BY_ID: Record<number, Chain> = Object.fromEntries(
  CHAINS.map((c) => [c.id, c])
) as Record<number, Chain>;

export const getRpcUrl = (chainId: number): string => {
  return `https://lb.drpc.live/ethereum/Ak80gSCleU1Frwnafb5Ka4WfOo73wukR8JNAQmlfqV1j`;
}

export const reader = createReader({
  [mainnet.id]: getRpcUrl(mainnet.id),
  [arbitrum.id]: getRpcUrl(arbitrum.id),
});

export function createReader(rpcs: RpcMap) {
  const clients = Object.fromEntries(
    Object.entries(rpcs).map(([key, url]) => [
      key,
      createPublicClient({
        chain: CHAINS_BY_ID[Number(key)],
        transport: http(url)
      }),
    ])
  ) as Record<number, ReturnType<typeof createPublicClient>>;

  async function read<T = unknown>(
    chain: number,
    call: Call,
    blockNumber?: bigint
  ): Promise<T> {
    const client = clients[chain];
    if (!client) throw new Error(`Unknown chain "${chain}"`);

    // @ts-expect-error simplification
    return client.readContract({
      ...call,
      blockNumber,
    });
  }

  async function call<T = unknown>(
    chain: number,
    data: any,
    blockNumber?: bigint
  ): Promise<T> {
    const client = clients[chain];
    if (!client) throw new Error(`Unknown chain "${chain}"`);

    // @ts-expect-error simplification
    return client.call({
      data,
      blockNumber,
    });
  }

  async function readMany(chain: number, calls: Call[], blockNumber?: bigint) {
    const client = clients[chain];
    if (!client) throw new Error(`Unknown chain "${chain}"`);
    const res = await client.multicall({
      contracts: calls as any,
      allowFailure: false,
      blockNumber,
    });
    return res;
  }

  async function readAll(
    callsPerChain: Record<number, Call[]>,
    blockNumbers?: Record<number, bigint>
  ) {
    const results = await Promise.all(
      Object.entries(callsPerChain).map(async ([chain, calls]) => {
        const blockNumber = blockNumbers?.[Number(chain)];
        return [
          chain,
          await readMany(parseInt(chain), calls, blockNumber),
        ];
      })
    );
    return Object.fromEntries(results) as Record<string, unknown[]>;
  }

  return { read, readMany, readAll, call, client: (k: number) => clients[k] };
}