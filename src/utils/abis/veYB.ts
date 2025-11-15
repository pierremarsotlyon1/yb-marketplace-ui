import { parseAbi } from "viem";

export const veYBAbi = parseAbi([
    'function totalVotes() external view returns(uint256)',
])