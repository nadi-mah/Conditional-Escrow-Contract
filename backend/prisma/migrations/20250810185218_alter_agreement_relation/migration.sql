/*
  Warnings:

  - A unique constraint covering the columns `[onChainId]` on the table `Agreement` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Agreement" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "detail" DROP NOT NULL,
ALTER COLUMN "payerConfirmed" SET DEFAULT false,
ALTER COLUMN "payeeConfirmed" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_onChainId_key" ON "public"."Agreement"("onChainId");
