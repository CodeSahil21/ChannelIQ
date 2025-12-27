import { TypedServer, TypedSocket, SocketHandler, MessageData, SocketCallback } from "./types";
import { SocketMessageService } from "../services/socket.service";
import { SessionManager } from "./sessionManager";
import { MessageProducer } from "../kafka/messageProducer";
import { v4 as uuidv4 } from 'uuid';

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

      const messageId = uuidv4();
      const useBulkProcessing = process.env.ENABLE_BULK_MESSAGES === 'true';

      if (useBulkProcessing) {
        // Bulk processing: Publish to Kafka and emit immediately
        try {
          const messageEventData = {
            messageId,
            groupId,
            senderId: socket.user.id,
            type,
            ...(content && { content }),
            ...(fileUrl && { fileUrl }),
            ...(replyToId && { replyToId })
          };
          
          console.log(`[BULK] Publishing message event to Kafka:`, {
            messageId,
            groupId,
            senderId: socket.user.id,
            type,
            timestamp: new Date().toISOString()
          });
          
          await MessageProducer.publishMessageEvent(messageEventData);

          // Emit optimistic update immediately
          const optimisticMessage = {
            id: messageId,
            content: content || null,
            type,
            fileUrl: fileUrl || null,
            groupId,
            senderId: socket.user.id,
            replyToId: replyToId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
            sender: {
              id: socket.user.id,
              email: socket.user.email,
              fullName: socket.user.fullName,
              profileUrl: socket.user.profileUrl,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            reactions: [],
            statuses: []
          };

          io.to(`group:${groupId}`).emit("message:optimistic", optimisticMessage);
          console.log(`[BULK] Emitted optimistic message for messageId: ${messageId}`);
          handleSuccess(cb, { messageId });
        } catch (kafkaError) {
          console.warn('Kafka publish failed, falling back to direct insert:', kafkaError);
          // Fallback to original method
          const messageData: MessageData = { 
            groupId, 
            type, 
            senderId: socket.user.id
          };
          if (content) messageData.content = content;
          if (fileUrl !== undefined) messageData.fileUrl = fileUrl;
          if (replyToId !== undefined) messageData.replyToId = replyToId;

          const message = await SocketMessageService.createMessage(messageData);
          const messageWithRelations = {
            ...message,
            reactions: [],
            statuses: []
          };
          
          io.to(`group:${groupId}`).emit("message:persisted", messageWithRelations);
          handleSuccess(cb, { messageId: message.id });
        }
      } else {
        // Original direct processing
        const messageData: MessageData = { 
          groupId, 
          type, 
          senderId: socket.user.id
        };
        if (content) messageData.content = content;
        if (fileUrl !== undefined) messageData.fileUrl = fileUrl;
        if (replyToId !== undefined) messageData.replyToId = replyToId;

        const [message] = await Promise.all([
          SocketMessageService.createMessage(messageData),
        ]);
        
        const messageWithRelations = {
          ...message,
          reactions: [],
          statuses: []
        };
        
        io.to(`group:${groupId}`).emit("message:persisted", messageWithRelations);
        handleSuccess(cb, { messageId: message.id });
      }
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
      
      // Combined auth check and update in single operation
      const result = await SocketMessageService.updateMessageWithAuth(messageId, socket.user.id, sanitizedContent);
      
      io.to(`group:${result.groupId}`).emit("message:updated", {
        messageId, content: sanitizedContent, isDeleted: false, updatedAt: result.updatedAt
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
      
      // Combined auth check and delete in single operation
      const result = await SocketMessageService.deleteMessageWithAuth(messageId, socket.user.id);
      
      io.to(`group:${result.groupId}`).emit("message:updated", {
        messageId, isDeleted: true, updatedAt: result.updatedAt
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

  // Poll Voting - Optimized
  socket.on("poll:vote", async ({ pollId, optionId }, cb) => {
    try {
      if (!validateInput({ pollId, optionId }, ['pollId', 'optionId'])) {
        return handleError(cb, "Missing required fields");
      }

      // Combined poll verification, membership check, and vote handling
      const result = await SocketMessageService.handlePollVoteOptimized(socket.user.id, pollId, optionId);

      // Emit updates for all affected options
      for (const option of result.updatedOptions) {
        io.to(`group:${result.groupId}`).emit("poll:vote:update", {
          pollId, 
          optionId: option.optionId, 
          userId: socket.user.id, 
          voteCount: option.voteCount,
          hasVoted: option.hasVoted
        });
      }

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