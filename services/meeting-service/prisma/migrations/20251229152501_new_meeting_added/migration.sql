/*
  Warnings:

  - You are about to drop the `Meeting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MeetingParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MeetingRecording` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'CO_HOST', 'PARTICIPANT');

-- AlterEnum
ALTER TYPE "MeetingStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_hostId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT "MeetingParticipant_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT "MeetingParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingRecording" DROP CONSTRAINT "MeetingRecording_meetingId_fkey";

-- DropTable
DROP TABLE "Meeting";

-- DropTable
DROP TABLE "MeetingParticipant";

-- DropTable
DROP TABLE "MeetingRecording";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hostId" INTEGER NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "inviteToken" TEXT NOT NULL,
    "inviteExpiresAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "passwordEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
    "id" SERIAL NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'PARTICIPANT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meetings_inviteToken_key" ON "meetings"("inviteToken");

-- CreateIndex
CREATE INDEX "meetings_hostId_idx" ON "meetings"("hostId");

-- CreateIndex
CREATE INDEX "meetings_status_idx" ON "meetings"("status");

-- CreateIndex
CREATE INDEX "meetings_inviteToken_idx" ON "meetings"("inviteToken");

-- CreateIndex
CREATE INDEX "meeting_participants_meetingId_idx" ON "meeting_participants"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_participants_userId_idx" ON "meeting_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_meetingId_userId_key" ON "meeting_participants"("meetingId", "userId");

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
