import { parseAbi } from "viem";

export const friendtechABI = parseAbi([
  `function getBuyPrice(address,uint256)`,
  `function getPrice(uint256,uint256)`,
  `function getSellPrice(address,uint256)`,
  `function getSharesSupply(address) public view returns (uint256)`,
  `function lastExecuted()`,
  `function owner()`,
  `function renounceOwnership()`,
  `function setSharesSupply(address,uint256) external payable`,
  `function sharesSupply(address)`,
  `function transferOwnership(address)`,
]);
