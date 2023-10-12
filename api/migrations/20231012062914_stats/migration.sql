-- CreateTable
CREATE TABLE "WeeklyStatsBySubject" (
    "timestamp" INTEGER NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "subjectAddress" TEXT NOT NULL,
    "realized" DECIMAL(65,0) NOT NULL,
    "potential" DECIMAL(65,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyStatsBySubject_pkey" PRIMARY KEY ("timestamp","traderAddress","subjectAddress")
);

-- CreateTable
CREATE TABLE "WeeklyStats" (
    "timestamp" INTEGER NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "partKey" TEXT NOT NULL,
    "realized" DECIMAL(65,0) NOT NULL,
    "potential" DECIMAL(65,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyStats_pkey" PRIMARY KEY ("timestamp","traderAddress","partKey")
);

-- CreateTable
CREATE TABLE "DailyStatsBySubject" (
    "timestamp" INTEGER NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "subjectAddress" TEXT NOT NULL,
    "realized" DECIMAL(65,0) NOT NULL,
    "potential" DECIMAL(65,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStatsBySubject_pkey" PRIMARY KEY ("timestamp","traderAddress","subjectAddress")
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "timestamp" INTEGER NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "partKey" TEXT NOT NULL,
    "realized" DECIMAL(65,0) NOT NULL,
    "potential" DECIMAL(65,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("timestamp","traderAddress","partKey")
);
