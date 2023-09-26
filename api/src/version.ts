import { readFileSync } from "fs";

let v: undefined | string = undefined;
try {
  const v = readFileSync("../version.sha", { encoding: "utf-8" });
} catch {}

export const version = v || "unknown";
