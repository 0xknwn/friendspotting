import { parseAbi } from "viem";

export const sourceABI = parseAbi([
  `function sharesSupply(address) public view returns (uint256)`,
]);
