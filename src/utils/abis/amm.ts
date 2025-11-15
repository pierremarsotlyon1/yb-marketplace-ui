import { parseAbi } from "viem";

export const ammAbi = parseAbi([
    'function get_debt() external view returns(uint256)',
    'function collateral_amount() external view returns(uint256)',
    'function value_oracle_for(uint256, uint256) external view returns(uint256,uint256)',
    'function value_oracle() external view returns(uint256, uint256)',
    'function max_debt() external view returns(uint256)',
])