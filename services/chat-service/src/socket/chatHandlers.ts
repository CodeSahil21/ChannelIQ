import { TypedServer, TypedSocket, SocketHandler, MessageData, SocketCallback } from "./types";
import { SocketMessageService } from "../services/socket.service";
import { SessionManager } from "./sessionManager";

// Helper functions
const handleError = (cb: SocketCallback | undefined, error: string) => cb?.({ success: false, error });
const handleSuccess = (cb: SocketCallback | undefined, data?: any) => cb?.({ success: true, ...data });

export const registerChatHandlers: SocketHandler = (io: TypedServer, socket: TypedSocket) => {
  // Input validation and sanitization helpers
  const validateInput = (data: any, requiredFields: string[]): boolean => {
    return requiredFields.every(field => {
      const value = data[field];
      return value != null && String(value).trim() !== '';
    });
  };

  const sanitizeContent = (content: string): string => {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const validateEmoji = (emoji: string): boolean => {
    // Allow only Unicode emoji characters and common emoji shortcodes
    const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]|:[a-z_]+:$/u;
    return emojiRegex.test(emoji) && emoji.length <= 10;
  };

  // Group Management
  socket.on("group:join", async ({ groupId }, cb) => {
    try {
      await SocketMessageService.verifyGroupMember(socket.user.id, groupId);
      socket.join(`group:${groupId}`);
      SessionManager.addUserToGroup(socket.id, groupId);
      handleSuccess(cb);
    } catch (err: any) {
      handleError(cb, err.message);
    }
  });

  socket.on("group:leave", ({ groupId }) => {
    socket.leave(`group:${groupId}`);
    SessionManager.removeUserFromGroup(socket.id, groupId);
  });

  // Message Operations
  socket.on("message:send", async (payload, cb) => {
    try {
      const { groupId, content, type, replyToId, fileUrl } = payload;
      
      if (!validateInput(payload, ['groupId', 'type'])) {
        return handleError(cb, "Missing required fields");
      }
      
      if (!SessionManager.isUserInGroup(socket.id, groupId)) {
        return handleError(cb, "Must join group first");
      }

      const messageData: MessageData = { 
        groupId, 
        type, 
        senderId: socket.user.id
      };
      if (content) messageData.content = content;
      if (fileUrl !== undefined) messageData.fileUrl = fileUrl;
      if (replyToId !== undefined) messageData.replyToId = replyToId;

      // Parallel operations: create message and emit immediately
      const [message] = await Promise.all([
        SocketMessageService.createMessage(messageData),
        // Could add other parallel operations here
      ]);
      
      // Add missing properties for type compatibility
      const messageWithRelations = {
        ...message,
        reactions: [],
        statuses: []
      };
      
      // Emit immediately after message creation
      io.to(`group:${groupId}`).emit("message:persisted", messageWithRelations);
      handleSuccess(cb, { messageId: message.id });
    } catch (err: any) {
      handleError(cb, err.message);
    }
  });

  socket.on("message:edit", async ({ messageId, content }, cb) => {
    try {
      if (!validateInput({ messageId, content }, ['messageId', 'content'])) {
        return handleError(cb, "Missing required fields");
      }
      const sanitizedContent = sanitizeContent(content);
      const message = await SocketMessageService.findMessageWithAuth(messageId, socket.user.id);
      const updated = await SocketMessageService.updateMessage(messageId, sanitizedContent);
      io.to(`group:${message.groupId}`).emit("message:updated", {
        messageId, content: sanitizedContent, isDeleted: false, updatedAt: updated.updatedAt
      });
      handleSuccess(cb);
    } catch (err: any) {
      handleError(cb, err?.message || 'Unknown error');
    }
  });

  socket.on("message:delete", async ({ messageId }, cb) => {
    try {
      if (!validateInput({ messageId }, ['messageId'])) {
        return handleError(cb, "Missing required fields");
      }
      const message = await SocketMessageService.findMessageWithAuth(messageId, socket.user.id);
      const updated = await SocketMessageService.deleteMessage(messageId);
      io.to(`group:${message.groupId}`).emit("message:updated", {
        messageId, isDeleted: true, updatedAt: updated.updatedAt
      });
      handleSuccess(cb);
    } catch (err: any) {
      handleError(cb, err.message);
    }
  });

  // Reactions with optimized flow
  const handleReaction = async (messageId: string, emoji: string, action: "add" | "remove", cb: SocketCallback | undefined) => {
    try {
      const message = await SocketMessageService.findMessageForReaction(messageId);
      if (!message) return handleError(cb, "Message not found");
      
      // Use cached membership verification
      await SocketMessageService.verifyGroupMember(socket.user.id, message.groupId);
      
      // Execute reaction update and emit in parallel
      const reactionPromise = action === "add" 
        ? SocketMessageService.addReaction(messageId, socket.user.id, emoji)
        : SocketMessageService.removeReaction(messageId, socket.user.id, emoji);
      
      // Don't wait for DB update to emit (optimistic update)
      io.to(`group:${message.groupId}`).emit("reaction:updated", {
        messageId, emoji, userId: socket.user.id, action
      });
      
      // Complete DB update in background
      reactionPromise.catch(error => {
        console.error('Reaction update failed:', error);
        // Could emit a correction event here if needed
      });
      
      handleSuccess(cb);
    } catch (err: any) {
      handleError(cb, err.message);
    }
  };

  socket.on("message:reaction:add", async ({ messageId, emoji }, cb) => {
    if (!validateInput({ messageId, emoji }, ['messageId', 'emoji'])) {
      return handleError(cb, "Missing required fields");
    }
    if (!validateEmoji(emoji)) {
      return handleError(cb, "Invalid emoji format");
    }
    await handleReaction(messageId, emoji, "add", cb);
  });

  socket.on("message:reaction:remove", async ({ messageId, emoji }, cb) => {
    if (!validateInput({ messageId, emoji }, ['messageId', 'emoji'])) {
      return handleError(cb, "Missing required fields");
    }
    if (!validateEmoji(emoji)) {
      return handleError(cb, "Invalid emoji format");
    }
    await handleReaction(messageId, emoji, "remove", cb);
  });

  // Poll Voting
  socket.on("poll:vote", async ({ pollId, optionId }, cb) => {
    try {
      if (!validateInput({ pollId, optionId }, ['pollId', 'optionId'])) {
        return handleError(cb, "Missing required fields");
      }

      const poll = await SocketMessageService.findPoll(pollId);
      if (!poll) return handleError(cb, "Poll not found");

      // Verify user is a group member
      await SocketMessageService.verifyGroupMember(socket.user.id, poll.message.groupId);

      // Create vote (Prisma will handle duplicate prevention)
      await SocketMessageService.createPollVote(socket.user.id, optionId);

      // Get updated vote count and emit to group
      const voteCount = await SocketMessageService.countPollVotes(optionId);
      io.to(`group:${poll.message.groupId}`).emit("poll:vote:update", {
        pollId, optionId, userId: socket.user.id, voteCount
      });

      handleSuccess(cb);
    } catch (err: any) {
      handleError(cb, err.message);
    }
  });

  // Real-time Features
  socket.on("user:typing", ({ groupId, isTyping }) => {
    if (!validateInput({ groupId, isTyping }, ['groupId'])) {
      return; // Silently ignore invalid typing events
    }
    if (!SessionManager.isUserInGroup(socket.id, groupId)) {
      return; // Silently ignore unauthorized typing events
    }
    socket.to(`group:${groupId}`).emit("typing:updated", {
      groupId, userId: socket.user.id, isTyping, fullName: socket.user.fullName
    });
  });

  socket.on("message:read", async ({ messageId, groupId }) => {
    try {
      if (!validateInput({ messageId, groupId }, ['messageId', 'groupId'])) {
        return;
      }
      if (!SessionManager.isUserInGroup(socket.id, groupId)) {
        return;
      }
      await SocketMessageService.updateMessageStatus(messageId, socket.user.id, "READ");
      io.to(`group:${groupId}`).emit("message:read", { messageId, userId: socket.user.id });
    } catch (err: any) {
      console.error("Message read error:", err?.message || 'Unknown error');
    }
  });

  socket.on("message:delivered", async ({ messageId, groupId }) => {
    try {
      if (!validateInput({ messageId, groupId }, ['messageId', 'groupId'])) {
        return;
      }
      if (!SessionManager.isUserInGroup(socket.id, groupId)) {
        return;
      }
      await SocketMessageService.updateMessageStatus(messageId, socket.user.id, "DELIVERED");
      io.to(`group:${groupId}`).emit("message:delivered", { messageId, userId: socket.user.id });
    } catch (err: any) {
      console.error("Message delivered error:", err?.message || 'Unknown error');
    }
  });

  socket.on("disconnect", () => {
    SessionManager.removeUserFromAllGroups(socket.id);
    socket.broadcast.emit("user:status", {
      userId: socket.user.id,
      status: "offline",
      lastSeen: new Date()
    });
  });
};