import { expect, describe, it, afterEach, vi } from "vitest";
import { _unittest, computeTradersOverTime } from "./stats";
import { PrismaClient } from "@prisma/client";
import { Address } from "viem";
const {
  _mapSubjectTradersOverTime,
  _computeTradersSubjectsOverTime,
  _computeTradersOverTime,
  _computeTradersOverTimeAndPart,
} = _unittest;

import type {
  mapSubjectsTradersHistory,
  mapTradersSubjectsPerformance,
  TraderPerformance,
  subjectTradersHistory,
  Trade,
} from "./stats";

vi.mock("./side-effects/stats", () => {
  return {
    querySubjectTradersOverTime: async (
      prisma: PrismaClient,
      part: string,
      startTimestamp: number,
      endTimestamp: number
    ) => {
      if (part !== "0xd") {
        return [] as {
          timestamp: number;
          traderAddress: string;
          subjectAddress: string;
          isBuy: boolean;
          shareAmount: number;
          supply: number;
        }[];
      }
      return [
        {
          timestamp: 5,
          traderAddress: "0x02",
          subjectAddress: "0xdeadbeef",
          isBuy: false,
          shareAmount: 1,
          supply: 10,
        },
        {
          timestamp: 1,
          traderAddress: "0x01",
          subjectAddress: "0xdeadbeef",
          isBuy: false,
          shareAmount: 1,
          supply: 12,
        },
        {
          timestamp: 5,
          traderAddress: "0x02",
          subjectAddress: "0xdeadbeef",
          isBuy: false,
          shareAmount: 1,
          supply: 16,
        },
        {
          timestamp: 0,
          traderAddress: "0x01",
          subjectAddress: "0xdeadbeef",
          isBuy: true,
          shareAmount: 1,
          supply: 50,
        },
      ] as {
        timestamp: number;
        traderAddress: string;
        subjectAddress: string;
        isBuy: boolean;
        shareAmount: number;
        supply: number;
      }[];
    },
  };
});

vi.mock("./price", () => {
  return {
    tradingGain: (
      supplyAfterPurchase: number,
      supplyAfterSale: number,
      amount: number
    ) => {
      return amount * (supplyAfterSale - supplyAfterPurchase);
    },
  };
});

/**
 * @todo provide several mock to test different cases
 */

describe("compute stats", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("check _mapSubjectTradersOverTime including sort", async () => {
    const map = await _mapSubjectTradersOverTime(
      new PrismaClient(),
      "0xd",
      0,
      1
    );
    expect(map).toBeDefined();
    if (!map) {
    }
    expect(
      (map as mapSubjectsTradersHistory).get("0xdeadbeef")?.endSupply
    ).toBe(10);
    expect(
      (map as mapSubjectsTradersHistory).get("0xdeadbeef")?.startSupply
    ).toBe(49);
    expect((map as mapSubjectsTradersHistory).get("0xdeadbeef")?.subject).toBe(
      "0xdeadbeef"
    );
    expect(
      (map as mapSubjectsTradersHistory)
        .get("0xdeadbeef")
        ?.traderHistory?.get("0x01")?.length
    ).toBe(2);
    const traderHistory0x1 = (map as mapSubjectsTradersHistory)
      .get("0xdeadbeef")
      ?.traderHistory?.get("0x01");
    if (!traderHistory0x1) {
      expect(true).toBe(false);
      return;
    }
    expect(traderHistory0x1[0]).toEqual({
      amount: 1,
      isBuy: false,
      supply: 12,
      timestamp: 1,
    });
    expect(traderHistory0x1[1]).toEqual({
      amount: 1,
      isBuy: true,
      supply: 50,
      timestamp: 0,
    });
    expect(
      (map as mapSubjectsTradersHistory)
        .get("0xdeadbeef")
        ?.traderHistory?.get("0x02")?.length
    ).toBe(2);
    const traderHistory0x2 = (map as mapSubjectsTradersHistory)
      .get("0xdeadbeef")
      ?.traderHistory?.get("0x02");
    if (!traderHistory0x2) {
      expect(true).toBe(false);
      return;
    }
    expect(traderHistory0x2[0]).toEqual({
      amount: 1,
      isBuy: false,
      supply: 10,
      timestamp: 5,
    });
    expect(traderHistory0x2[1]).toEqual({
      amount: 1,
      isBuy: false,
      supply: 16,
      timestamp: 5,
    });
  });

  it("check _computeTradersOverTimeAndPart", async () => {
    const tradersOverTimeAndPart = await _computeTradersOverTimeAndPart(
      new PrismaClient(),
      "0xd",
      0,
      1
    );
    expect(tradersOverTimeAndPart).toBeDefined();
    if (!tradersOverTimeAndPart) {
      return;
    }
    expect(tradersOverTimeAndPart.part).toBe("0xd");
    expect(tradersOverTimeAndPart.tradersOverTime.get("0x01")).toEqual({
      potential: 0,
      realized: -38,
    });
  });

  it("check _computeTradersSubjectsOverTime", () => {
    const mapSubjectsTradersHistory = new Map<Address, subjectTradersHistory>([
      [
        "0xdeadbeef" as Address,
        {
          subject: "0xdeadbeef" as Address,
          startSupply: 49,
          endSupply: 10,
          traderHistory: new Map<Address, Trade[]>([
            [
              "0x01",
              [
                {
                  amount: 1,
                  isBuy: false,
                  supply: 12,
                  timestamp: 1,
                },
                {
                  amount: 1,
                  isBuy: true,
                  supply: 50,
                  timestamp: 0,
                },
              ],
            ],
            [
              "0x02",
              [
                {
                  amount: 1,
                  isBuy: true,
                  supply: 8,
                  timestamp: 5,
                },
                {
                  amount: 1,
                  isBuy: false,
                  supply: 16,
                  timestamp: 5,
                },
              ],
            ],
          ]),
        },
      ],
    ]);
    const map = _computeTradersSubjectsOverTime(
      mapSubjectsTradersHistory,
      "0xd"
    );
    expect(map.partition).toBe("0xd");
    expect(
      map.mapTradersSubjectsPerformance.get("0x01")?.get("0xdeadbeef")
    ).toEqual({
      potential: 0,
      realized: -38,
    });
    expect(
      map.mapTradersSubjectsPerformance.get("0x02")?.get("0xdeadbeef")
    ).toEqual({
      potential: 2,
      realized: -33,
    });
    /**
     * @todo provide additional tests that check we can sell 3 from 2 purchases
     * for instance
     */
  });

  it("check _computeTradersOverTime", () => {
    const mapTradersSubjectsPerformance: mapTradersSubjectsPerformance =
      new Map<Address, Map<Address, TraderPerformance>>([
        [
          "0x01",
          new Map<Address, TraderPerformance>([
            [
              "0xdeadbeef",
              {
                potential: 2,
                realized: -33,
              },
            ],
            [
              "0xbaadf00d",
              {
                potential: -2,
                realized: 0,
              },
            ],
          ]),
        ],
      ]);
    const map = _computeTradersOverTime(mapTradersSubjectsPerformance);
    expect(map.get("0x01")).toEqual({
      potential: 0,
      realized: -33,
    });
  });

  it("check computeTradersOverTime", async () => {
    const mapTradersPerformance = await computeTradersOverTime(
      new PrismaClient(),
      0,
      1
    );
    expect(mapTradersPerformance).toBeDefined();
    if (!mapTradersPerformance) {
      return;
    }
    expect(mapTradersPerformance.get("0x01")).toEqual({
      potential: 0,
      realized: -38,
    });
  });
});
