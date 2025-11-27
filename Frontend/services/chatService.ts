import { io, Socket } from 'socket.io-client';
import { API } from '../constants/Api';

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name?: string;
  description?: string;
  participants: Participant[];
  eventId?: string;
  avatar?: string;
  lastMessage?: LastMessage;
  unreadCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Participant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'admin' | 'member';
  joinedAt: string;
  lastReadAt: string;
}

export interface LastMessage {
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  readBy: Array<{ userId: string; readAt: string }>;
  reactions: Array<{ userId: string; userName: string; emoji: string; timestamp: string }>;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

class ChatService {
  private socket: Socket | null = null;
  private token: string = '';

  initializeSocket(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.token = token;
    this.socket = io(API.BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async getUserConversations(token: string): Promise<Conversation[]> {
    const response = await fetch(`${API.BASE_URL}/api/chat/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch conversations');
    }

    return result.conversations || [];
  }

  async getUnreadCountWithUser(otherUserId: string, token: string): Promise<number> {
    try {
      const response = await fetch(
        `${API.BASE_URL}/api/chat/conversations/unread/${otherUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch unread count');
      }

      return result.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0; // Return 0 on error to avoid breaking UI
    }
  }

  async createOrGetDM(otherUserId: string, token: string): Promise<Conversation> {
    const response = await fetch(`${API.BASE_URL}/api/chat/conversations/dm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ otherUserId })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create DM');
    }

    return result.conversation;
  }

  async createGroupChat(name: string, participantIds: string[], token: string, eventId?: string): Promise<Conversation> {
    const response = await fetch(`${API.BASE_URL}/api/chat/conversations/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, participantIds, eventId })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create group chat');
    }

    return result.conversation;
  }

  async getConversation(conversationId: string, token: string): Promise<Conversation> {
    const response = await fetch(
      `${API.BASE_URL}/api/chat/conversations/${conversationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch conversation');
    }

    return result.conversation;
  }

  async getMessages(conversationId: string, token: string, page: number = 1): Promise<Message[]> {
    const response = await fetch(
      `${API.BASE_URL}/api/chat/conversations/${conversationId}/messages?page=${page}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch messages');
    }

    return result.messages || [];
  }

  async sendMessage(conversationId: string, content: string, token: string, type: string = 'text'): Promise<Message> {
    const response = await fetch(
      `${API.BASE_URL}/api/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, type })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send message');
    }

    return result.data;
  }

  // Socket event handlers
  joinConversation(conversationId: string) {
    this.socket?.emit('join:conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave:conversation', conversationId);
  }

  sendMessageViaSocket(conversationId: string, content: string, type: string = 'text') {
    this.socket?.emit('message:send', { conversationId, content, type });
  }

  startTyping(conversationId: string) {
    this.socket?.emit('typing:start', conversationId);
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('typing:stop', conversationId);
  }

  markMessageAsRead(messageId: string, conversationId: string) {
    this.socket?.emit('message:read', { messageId, conversationId });
  }

  // Event listeners
  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  onTyping(callback: (data: { userId: string; userName: string; isTyping: boolean }) => void) {
    this.socket?.on('typing:user', callback);
  }

  onMessageRead(callback: (data: { messageId: string; conversationId: string; userId: string }) => void) {
    this.socket?.on('message:read', callback);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const chatService = new ChatService();





