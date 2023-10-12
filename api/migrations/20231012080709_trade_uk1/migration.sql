/*
  Warnings:

  - A unique constraint covering the columns `[subjectAddress,timestamp,transactionIndex]` on the table `Trade` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Trade_subjectAddress_timestamp_transactionIndex_key" ON "Trade"("subjectAddress", "timestamp" DESC, "transactionIndex" DESC);
