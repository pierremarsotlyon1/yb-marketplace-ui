import { Address } from "viem";

/**
 * Represents a single sell order on the marketplace
 */
export interface Order {
  orderId: bigint;
  seller: Address;
  yTokenAmountRemaining: bigint;
  premiumPerSmallestAssetUnit: bigint;
  isActive: boolean;
  
  // UI-only formatted fields (added in the hook)
  amountFormatted: string;
  premiumFormatted: string;
}