import React, { useState } from 'react';
import { HiSpeakerphone, HiChartBar, HiBookmark } from 'react-icons/hi';
import { CreatePollModal, CreateAnnouncementModal, PinnedMessagesModal } from './index';

interface GroupActionsProps {
  groupId: string;
  onPollCreated?: () => void;
  onAnnouncementCreated?: () => void;
}

const GroupActions: React.FC<GroupActionsProps> = ({ 
  groupId, 
  onPollCreated, 
  onAnnouncementCreated 
}) => {
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isPinnedMessagesModalOpen, setIsPinnedMessagesModalOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setIsPollModalOpen(true)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <HiChartBar />
        Create Poll
      </button>
      
      <button
        onClick={() => setIsAnnouncementModalOpen(true)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <HiSpeakerphone />
        Create Announcement
      </button>

      <button
        onClick={() => setIsPinnedMessagesModalOpen(true)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <HiBookmark />
        Pinned Messages
      </button>

      <CreatePollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        groupId={groupId}
        onPollCreated={onPollCreated}
      />

      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        groupId={groupId}
        onAnnouncementCreated={onAnnouncementCreated}
      />
      <PinnedMessagesModal
        isOpen={isPinnedMessagesModalOpen}
        onClose={() => setIsPinnedMessagesModalOpen(false)}
        groupId={groupId}
      />
    </div>
  );
};

export { GroupActions };
export default GroupActions;