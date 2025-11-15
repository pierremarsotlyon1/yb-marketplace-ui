import { Address } from "viem";

export function shortAddr(a: Address | string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}