import { parseAbi } from "viem";

export const poolAbi = parseAbi([
    'function xcp_profit() external view returns(uint256)',
    'function xcp_profit_a() external view returns(uint256)',
    'function get_virtual_price() external view returns(uint256)',
    'function price_scale() external view returns(uint256)'
])