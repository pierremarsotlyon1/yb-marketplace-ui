import { maxUint256 } from "viem"

export const isInfiniteLock = (locktime: number | string): boolean => {
    return maxUint256 === BigInt(locktime);
}