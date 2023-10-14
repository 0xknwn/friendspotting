import { mnemonicToSeed } from "bip39";
import {
  PublicClient,
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import { HDKey, hdKeyToAccount } from "viem/accounts";
import type { Chain } from "viem/chains";

export const walletClient = async (chain: Chain, mnemonic: string) => {
  const hdkey = HDKey.fromMasterSeed(await mnemonicToSeed(mnemonic));
  const account = hdKeyToAccount(hdkey);
  const transport = http();
  const client = createWalletClient({
    account,
    chain,
    transport,
  });
  return client;
};

export const publicClient = async (chain: Chain) => {
  const client = createPublicClient({
    chain,
    transport: http(),
  }) as PublicClient;
  return client;
};
