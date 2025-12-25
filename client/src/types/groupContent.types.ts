export interface CreatePollRequest {
  question: string;
  options: string[];
  allowMultiple: boolean;
  expiresAt?: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
}

export interface Poll {
  id: string;
  messageId?: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  expiresAt?: string;
  createdAt: string;
  createdBy: {
    id: number;
    fullName: string;
  };
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  hasVoted?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: number;
    fullName: string;
  };
}

export interface GroupContentState {
  polls: {
    items: Poll[];
    loading: boolean;
    error: string | null;
  };
  announcements: {
    items: Announcement[];
    loading: boolean;
    error: string | null;
  };
  pinnedMessages: {
    items: any[];
    loading: boolean;
    error: string | null;
  };
}