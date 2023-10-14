import { parseAbi } from "viem";

export const abi = parseAbi([
  `function getBuyPrice(address,uint256)`,
  `function getPrice(uint256,uint256)`,
  `function getSellPrice(address,uint256)`,
  `function getSharesSupply(address) public view returns (uint256)`,
  `function lastExecuted()`,
  `function owner()`,
  `function renounceOwnership()`,
  `function setSharesSupply(address,uint256) external payable`,
  `function sharesSupply(address) public view returns (uint256)`,
  `function transferOwnership(address)`,
]);

export const address = "0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4";
