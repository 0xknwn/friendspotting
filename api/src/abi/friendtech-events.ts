import { parseAbiItem } from "viem";

export const events = parseAbiItem([
  `event Trade(address trader, address subject, bool isBuy, uint256 shareAmount, uint256 ethAmount, uint256 protocolEthAmount, uint256 subjectEthAmount, uint256 supply)`,
]);

export const address = "0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4"