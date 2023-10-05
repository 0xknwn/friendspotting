import { friendtechABI } from "./abi/friendtech";
import { getContract, Address } from "viem";
import { readFileSync } from "fs";

import { goerliPublicClient, goerliWalletClient } from "./wallet";

export const friendtechAddress =
  "0xa7c1de4d98d2564f3b3b97218b398db51c195f4d" as Address;

export const getMnemonic = () => {
  if (process.env.MNEMONIC_FILE) {
    const mnemonic = readFileSync(process.env.MNEMONIC_FILE, {
      encoding: "utf8",
    });
    if (mnemonic.length > 0) {
      return mnemonic;
    }
  }
  throw "mnemonic file not found";
};

export const setSharesSupply = async (
  address: `0x${string}`,
  value: bigint
) => {
  const goerli = await goerliPublicClient();
  const mnemonic = getMnemonic();
  const wallet = await goerliWalletClient(mnemonic);
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
