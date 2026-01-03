import React, { useEffect, useState } from 'react';
import { HiX, HiTrash, HiChartBar } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchPolls, deletePoll } from '../../store/groupContentSlice';
import { useSocket } from '../../hooks/useSocket';

interface PollsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

const PollsListModal: React.FC<PollsListModalProps> = ({ isOpen, onClose, groupId }) => {
  const dispatch = useAppDispatch();
  const { polls } = useAppSelector(state => state.groupContent);
  const { socket, votePoll, joinGroup } = useSocket();
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [localPolls, setLocalPolls] = useState(polls.items);

  useEffect(() => {
    setLocalPolls(polls.items);
  }, [polls.items]);

  useEffect(() => {
    if (isOpen && groupId) {
      dispatch(fetchPolls(groupId));
    }
  }, [isOpen, groupId, dispatch]);

  useEffect(() => {
    if (isOpen && groupId && socket) {
      joinGroup(groupId);
    }
  }, [isOpen, groupId, socket]); // Removed joinGroup from deps to fix TS issue

  useEffect(() => {
    if (!socket) return undefined;

    const handlePollVoteUpdate = (data: { pollId: string; optionId: string; userId: number; voteCount: number; hasVoted?: boolean }) => {
      // Poll vote update received
      setLocalPolls(prev => prev.map(poll => {
        if (poll.id === data.pollId) {
          return {
            ...poll,
            options: poll.options?.map(option => {
              if (option.id === data.optionId) {
                return { 
                  ...option, 
                  votes: data.voteCount,
                  hasVoted: data.hasVoted !== undefined ? data.hasVoted : option.hasVoted
                };
              }
              return option;
            }) || []
          };
        }
        return poll;
      }));
    };

    socket.on('poll:vote:update', handlePollVoteUpdate);
    return () => {
      socket.off('poll:vote:update', handlePollVoteUpdate);
    };
  }, [socket]);

  const handleVote = (pollId: string, optionId: string) => {
    // Voting
    votePoll(pollId, optionId, (response) => {
      // Vote response received
      if (!response.success) {
        toast.error('Vote failed. Please try again.');
      }
    });
  };

  const handleDeletePoll = async (messageId: string) => {
    try {
      await dispatch(deletePoll(messageId)).unwrap();
    } catch (error) {
      toast.error('Failed to delete poll. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-group-modal" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>Group Polls</h2>
          <button onClick={onClose} className="modal-close-btn">
            <HiX />
          </button>
        </div>

        <div className="create-group-form">
          {polls.loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p>Loading polls...</p>
            </div>
          ) : localPolls.length === 0 ? (
            <div className="text-center py-8">
              <HiChartBar className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No polls found in this group</p>
            </div>
          ) : (
            <div className="space-y-4">
              {localPolls.map((poll) => (
                <div key={poll.id} className="poll-item">
                  <div className="poll-header">
                    <h3 className="poll-question">{poll.question}</h3>
                    <div className="poll-actions">
                      <button
                        onClick={() => handleDeletePoll(poll.messageId!)}
                        className="poll-delete-btn"
                        title="Delete Poll"
                      >
                        <HiTrash />
                      </button>
                    </div>
                  </div>
                  
                  <div className="poll-options">
                    {poll.options?.map((option) => (
                      <div key={option.id} className="poll-option">
                        <button
                          onClick={() => handleVote(poll.id, option.id)}
                          className={`poll-option-btn ${option.hasVoted ? 'voted' : ''}`}
                        >
                          <span className="poll-option-text">{option.text}</span>
                          <div className="poll-option-stats">
                            <span className="poll-votes">{option.votes || 0} votes</span>
                            <div className="poll-progress">
                              <div 
                                className="poll-progress-bar" 
                                style={{ width: `${((option.votes || 0) / Math.max(1, poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 1)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </button>
                      </div>
                    )) || []}
                  </div>
                  
                  <div className="poll-meta">
                    <span className="poll-creator">By {poll.createdBy?.fullName || 'Unknown'}</span>
                    <span className="poll-date">{poll.createdAt ? new Date(poll.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                    {poll.expiresAt && (
                      <span className="poll-expires">Expires: {new Date(poll.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PollsListModal };
export default PollsListModal;