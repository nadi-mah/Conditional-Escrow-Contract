-- CreateEnum
CREATE TYPE "public"."AgreementState" AS ENUM ('Funded', 'Completed', 'Canceled', 'InDispute');

-- CreateTable
CREATE TABLE "public"."Agreement" (
    "id" SERIAL NOT NULL,
    "onChainId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "arbiter" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "currentState" "public"."AgreementState" NOT NULL,
    "payerConfirmed" BOOLEAN NOT NULL,
    "payeeConfirmed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);
