import { parseAbi } from "viem";

export const ltAbi = parseAbi([
    'function liquidity() external view returns(int256 admin, uint256 total, uint256 ideal_staked, uint256 staked)',
])