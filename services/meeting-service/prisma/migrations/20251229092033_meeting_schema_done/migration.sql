-- CreateEnum
CREATE TYPE "public"."MeetingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED');

-- CreateTable
CREATE TABLE "public"."Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "hostId" INTEGER NOT NULL,
    "status" "public"."MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeetingParticipant" (
    "id" SERIAL NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleAtJoin" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeetingRecording" (
    "id" SERIAL NOT NULL,
    "meetingId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meeting_groupId_idx" ON "public"."Meeting"("groupId");

-- CreateIndex
CREATE INDEX "Meeting_hostId_idx" ON "public"."Meeting"("hostId");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "public"."Meeting"("status");

-- CreateIndex
CREATE INDEX "MeetingParticipant_meetingId_idx" ON "public"."MeetingParticipant"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingParticipant_userId_idx" ON "public"."MeetingParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_userId_key" ON "public"."MeetingParticipant"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "MeetingRecording_meetingId_idx" ON "public"."MeetingRecording"("meetingId");

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingRecording" ADD CONSTRAINT "MeetingRecording_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
