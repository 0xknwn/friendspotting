import { friendtechABI } from "./abi/friendtech";
import { getContract, Address } from "viem";
import { getMnemonic } from "./mnemonic";

import { goerliPublicClient, goerliWalletClient } from "./wallet";

export const friendtechAddress =
  "0xa7c1de4d98d2564f3b3b97218b398db51c195f4d" as Address;

export const setSharesSupply = async (address: Address, value: bigint) => {
  const goerli = await goerliPublicClient();
  const mnemonic = getMnemonic();
  const wallet = await goerliWalletClient(mnemonic);
  console.log("configuration file", process.env.MNEMONIC_FILE);
  console.log("writing from", wallet.account.address);
  const friendtechContract = getContract({
    address: friendtechAddress,
    abi: friendtechABI,
    walletClient: wallet,
  });
  const hash = await friendtechContract.write.setSharesSupply(
    [address, value],
    {}
  );
  const receipt = await goerli.waitForTransactionReceipt({ hash });
  return receipt;
};

export const getSharesSupply = async (address: `0x${string}`) => {
  const goerli = await goerliPublicClient();
  const friendtechContract = getContract({
    address: friendtechAddress,
    abi: friendtechABI,
    publicClient: goerli,
  });
  const data = await friendtechContract.read.getSharesSupply([address]);
  return data;
};
