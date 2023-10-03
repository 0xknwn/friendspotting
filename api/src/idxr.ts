import { publicClient } from "./wallet";
import { parseAbiItem, Log } from "viem";
import type { Trade } from "@prisma/client";
import type { PublicClient } from "viem";
import { Prisma } from "@prisma/client";

const blockTimestamp = new Map<bigint, Number>();

const getTimestamp = (blockid: bigint) => {
  const ts = blockTimestamp.get(blockid);
  if (!ts) {
    return 0;
  }
  return ts;
};

export const currentBlock = async (
  client: PublicClient | undefined = undefined
) => {
  if (!client) {
    client = (await publicClient()) as PublicClient;
  }
  const block = await client.getBlock();
  blockTimestamp.set(block.number, Number(block.timestamp));
  return block.number;
};

export const previousTrades = async (
  blockGap: bigint,
  toBlock: bigint | undefined = undefined
) => {
  const client = await publicClient();
  if (!toBlock) {
    toBlock = await currentBlock(client);
  }
  const logs = await client.getLogs({
    address: "0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4",
    event: parseAbiItem(
      "event Trade(address trader, address subject, bool isBuy, uint256 shareAmount, uint256 ethAmount, uint256 protocolEthAmount, uint256 subjectEthAmount, uint256 supply)"
    ),
    fromBlock: toBlock - blockGap,
    toBlock: toBlock - 1n,
  });
  return logs;
};

export const saveEvent = async (t: Trade) => {
  console.log("**************");
  console.log("block:", t.blockNumber);
  console.log("hash:", t.hash);
  console.log("**************");
};

export const manageEvents = async (logs: Log[]) => {
  logs.forEach((log) => {
    console.log(log);
    const t = {
      hash: log.transactionHash,
      timestamp: getTimestamp(log.blockNumber || 0n),
      blockNumber: Number(log.blockNumber),
      fromAddress: log['args']['trader'],
      subjectAddress: log['args']['subject'],
      isBuy: log['args']['isBuy'],
      amount: Number(log['args']['shareAmount']),
      cost: new Prisma.Decimal(Number(log['args']['ethAmount'])),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Trade;


    args: {
      trader: '0x413b25973fe10E474b879Ef31ddDaC17bAc56DB2',
      subject: '0x413b25973fe10E474b879Ef31ddDaC17bAc56DB2',
      isBuy: false,
      shareAmount: 1n,
      ethAmount: 62500000000000n,
      protocolEthAmount: 3125000000000n,
      subjectEthAmount: 3125000000000n,
      supply: 1n
    },

    saveEvent(t);
  });
};

previousTrades(10n).then((logs) => {
  manageEvents(logs);
});
