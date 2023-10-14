-- CreateTable
CREATE TABLE "Log" (
    "transactionHash" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "eventIndex" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "args" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("transactionHash","eventIndex")
);

-- CreateTable
CREATE TABLE "Block" (
    "chain" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("chain","blockNumber")
);

-- CreateIndex
CREATE UNIQUE INDEX "Log_chain_blockNumber_transactionIndex_eventIndex_key" ON "Log"("chain", "blockNumber", "transactionIndex", "eventIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Log_chain_eventName_blockNumber_transactionIndex_eventIndex_key" ON "Log"("chain", "eventName", "blockNumber", "transactionIndex", "eventIndex");
