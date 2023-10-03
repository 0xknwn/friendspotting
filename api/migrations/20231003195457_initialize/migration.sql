-- CreateTable
CREATE TABLE "Trade" (
    "transactionHash" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "subjectAddress" TEXT NOT NULL,
    "isBuy" BOOLEAN NOT NULL,
    "shareAmount" INTEGER NOT NULL,
    "ethAmount" BIGINT NOT NULL,
    "protocolEthAmount" BIGINT NOT NULL,
    "subjectEthAmount" BIGINT NOT NULL,
    "supply" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("transactionHash")
);

-- CreateTable
CREATE TABLE "User" (
    "address" TEXT NOT NULL,
    "twitterUsername" TEXT,
    "twitterName" TEXT,
    "twitterPfpUrl" TEXT,
    "twitterUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trade_transactionHash_key" ON "Trade"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");
