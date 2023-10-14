import { abi } from "./abi/friendtech-functions";
import { getContract, Address } from "viem";
import { getMnemonic } from "./mnemonic";

import { publicClient, walletClient } from "./wallet";
import { baseGoerli } from "viem/chains";
const mockedFriendtechAddress =
  "0xa7c1de4d98d2564f3b3b97218b398db51c195f4d" as Address;

export const setSharesSupply = async (address: Address, value: bigint) => {
  const goerli = await publicClient(baseGoerli);
  const mnemonic = getMnemonic();
  const wallet = await walletClient(baseGoerli, mnemonic);
  console.log("configuration file", process.env.MNEMONIC_FILE);
  console.log("writing from", wallet.account.address);
  const friendtechContract = getContract({
    address: mockedFriendtechAddress,
    abi,
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
  const goerli = await publicClient(baseGoerli);
  const friendtechContract = getContract({
    address: mockedFriendtechAddress,
    abi,
    publicClient: goerli,
  });
  const data = await friendtechContract.read.getSharesSupply([address]);
  return data;
};
