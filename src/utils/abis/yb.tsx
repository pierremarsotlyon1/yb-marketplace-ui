import { parseAbi } from "viem";

export const ybAbi = parseAbi([
    'function preview_emissions(uint256,uint256) external view returns(uint256)',
])