import { readFileSync } from "fs";

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
