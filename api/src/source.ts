import { abi, address as contractAddress } from "./abi/friendtech-functions";
import { getContract, Address } from "viem";

import { publicClient } from "./wallet";
import { base } from "viem/chains";

export const sourceSupply = async (address: Address) => {
  const client = await publicClient(base);
  const sourceContract = getContract({
    address: contractAddress,
    abi,
    publicClient: client,
  });
  const data = await sourceContract.read.sharesSupply([address]);
  return data;
};
