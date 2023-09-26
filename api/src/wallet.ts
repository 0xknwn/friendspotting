import { mnemonicToSeed } from "bip39";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { HDKey, hdKeyToAccount } from "viem/accounts";

export const walletClient = async (mnemonic: string, url: string) => {
  const hdkey = HDKey.fromMasterSeed(await mnemonicToSeed(mnemonic));
  const account = hdKeyToAccount(hdkey);
  const transport = http(url);
  const client = createWalletClient({
    account,
    chain: base,
    transport,
  });
  return client;
};

export const publicClient = async (url: string) => {
  const transport = http(url);
  const client = createPublicClient({
    chain: base,
    transport,
  });
  return client;
};
