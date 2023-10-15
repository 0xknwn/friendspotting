-- CreateTable
CREATE TABLE "FriendTechTrade" (
    "chain" TEXT NOT NULL DEFAULT 'mainnet',
    "transactionHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "subjectAddress" TEXT NOT NULL,
    "isBuy" BOOLEAN NOT NULL,
    "shareAmount" INTEGER NOT NULL,
    "ethAmount" DECIMAL(65,0) NOT NULL,
    "protocolEthAmount" DECIMAL(65,0) NOT NULL,
    "subjectEthAmount" DECIMAL(65,0) NOT NULL,
    "supply" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendTechTrade_pkey" PRIMARY KEY ("transactionHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendTechTrade_subjectAddress_blockNumber_transactionIndex_key" ON "FriendTechTrade"("subjectAddress", "blockNumber" DESC, "transactionIndex" DESC);

-- AddForeignKey
ALTER TABLE "FriendTechTrade" ADD CONSTRAINT "FriendTechTrade_chain_blockNumber_fkey" FOREIGN KEY ("chain", "blockNumber") REFERENCES "Block"("chain", "blockNumber") ON DELETE RESTRICT ON UPDATE CASCADE;
