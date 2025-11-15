import { parseAbi } from "viem";

export const crvusdOracleAbi = parseAbi([
    'function last_price() external view returns(uint256)',
])