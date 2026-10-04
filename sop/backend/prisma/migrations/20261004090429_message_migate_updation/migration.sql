-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('NORMAL', 'URGENT');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('UNREAD', 'ACCEPTED', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "MessagePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MessageStatus" NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cleanerId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
