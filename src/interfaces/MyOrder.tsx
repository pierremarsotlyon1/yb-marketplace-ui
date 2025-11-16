import { Address } from "viem";
import { Order } from "./Order";

/**
 * Represents a single sell order on the marketplace
 */
export interface MyOrder extends Order {
  marketplace: Address;
  marketplaceName: string;
}