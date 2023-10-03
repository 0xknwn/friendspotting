import { mnemonicToSeed } from "bip39";
import {
  PublicClient,
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import { base } from "viem/chains";
import { HDKey, hdKeyToAccount } from "viem/accounts";

export const walletClient = async (mnemonic: string) => {
  const hdkey = HDKey.fromMasterSeed(await mnemonicToSeed(mnemonic));
  const account = hdKeyToAccount(hdkey);
  const transport = http();
  const client = createWalletClient({
    account,
    chain: base,
    transport,
  });
  return client;
};

export const publicClient = async () => {
  const client = createPublicClient({
    chain: base,
    transport: http(),
  }) as PublicClient;
  return client;
};
