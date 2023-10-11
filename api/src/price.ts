/**
 * Returns the price of a key before the share with the protocol and the owner
 * @param {number} supply - The supply of keys at the time of the purchase.
 * @param {number} amount - The number of keys that have been bought and sold
 * @returns {bigint} - The price of the key
 */
export const price = (supply: number, amount: number): bigint => {
  const sum1 =
    supply === 0 ? 0 : ((supply - 1) * supply * (2 * (supply - 1) + 1)) / 6;
  const sum2 =
    supply === 0 && amount === 1
      ? 0
      : ((supply - 1 + amount) *
          (supply + amount) *
          (2 * (supply - 1 + amount) + 1)) /
        6;
  const summation = BigInt((sum2 - sum1) * 10 ** 6);
  return (summation * 10n ** 12n) / 16000n;
};

/**
 * Returns the gain or loss associated with the purchase and sale of an amount of keys.
 * @param {number} supplyAfterPurchase - The supply of keys after the purchase.
 * @param {number} supplyAfterSale - the supply of keys after the sale.
 * @param {number} amount - The number of keys that have been bought and sold
 * @returns {number} - The gain (positive) or loss (negative) of the trade.
 */
export const tradingGain = (
  supplyAfterPurchase: number,
  supplyAfterSale: number,
  amount: number
) => {
  const purchasePrice =
    (11n * price(supplyAfterPurchase - amount, amount)) / 10n ** 12n;
  const salePrice = (9n * price(supplyAfterSale + 1, amount)) / 10n ** 12n;
  return Number(purchasePrice - salePrice) / 10 ** 7;
};
