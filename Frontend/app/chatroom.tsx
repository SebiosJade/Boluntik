import UserProfileModal from '@/components/UserProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, Conversation, Message } from '@/services/chatService';
import { webAlert } from '@/utils/webAlert';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string; otherUserId?: string; otherUserName?: string; conversationType?: string }>();
  const { user, token } = useAuth();

  const [conversationId, setConversationId] = useState<string | null>(params.conversationId || null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (token) {
      if (conversationId) {
        // Already have conversationId, load it directly
        loadConversation();
        loadMessages();
        initializeSocket();
      } else if (params.otherUserId) {
        // Need to create or get DM conversation
        createOrGetDMConversation();
      }
    }

    return () => {
      if (conversationId) {
        chatService.leaveConversation(conversationId);
      }
      // Don't remove all listeners as video call might be using them
      // chatService.removeAllListeners();
    };
  }, [conversationId, token]);

  const createOrGetDMConversation = async () => {
    if (!params.otherUserId || !token) return;

    setLoading(true);
    try {
      const conv = await chatService.createOrGetDM(params.otherUserId, token);
      setConversationId(conv.id);
      setConversation(conv);
      // Load messages for this conversation
      const msgs = await chatService.getMessages(conv.id, token);
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      // Initialize socket after getting conversation ID
      initializeSocketForConversation(conv.id);
    } catch (error: any) {
      console.error('Error creating/getting DM:', error);
      webAlert('Error', 'Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeSocketForConversation = (convId: string) => {
    if (!convId || !token) return;

    // Disconnect old socket if it exists to ensure fresh connection with current token
    const existingSocket = chatService.getSocket();
    if (existingSocket && existingSocket.connected) {
      chatService.disconnectSocket();
    }

    // Initialize socket with token
    const socket = chatService.initializeSocket(token);
    
    // Wait for socket to connect before joining
    if (!socket.connected) {
      socket.on('connect', () => {
        chatService.joinConversation(convId);
      });
    } else {
      // Already connected, join immediately
      chatService.joinConversation(convId);
    }

    // Set up event listeners
    setupSocketListeners();
  };

  const initializeSocket = () => {
    if (!conversationId || !token) return;
    initializeSocketForConversation(conversationId);
  };

  const setupSocketListeners = () => {
    const socket = chatService.getSocket();
    if (!socket) return;

    // Listen for new messages
    chatService.onNewMessage((message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    });

    // Listen for typing indicators
    chatService.onTyping((data) => {
      if (data.userId === user?.id) return;
      
      setTypingUsers(prev => {
        if (data.isTyping && !prev.includes(data.userName)) {
          return [...prev, data.userName];
        } else if (!data.isTyping) {
          return prev.filter(name => name !== data.userName);
        }
        return prev;
      });
    });
  };

  const loadConversation = async () => {
    if (!conversationId || !token) return;

    try {
      const conv = await chatService.getConversation(conversationId, token);
      setConversation(conv);
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      webAlert('Error', 'Failed to load conversation');
      router.back();
    }
  };

  const loadMessages = async () => {
    if (!conversationId || !token) return;

    setLoading(true);
    try {
      const msgs = await chatService.getMessages(conversationId, token);
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || !token) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      // Check if socket is connected
      const socket = chatService.getSocket();
      
      if (socket && socket.connected) {
        // Send via socket for real-time
        chatService.sendMessageViaSocket(conversationId, text);
      } else {
        // Fallback to HTTP if socket not connected
        console.log('Socket not connected, using HTTP fallback');
        const message = await chatService.sendMessage(conversationId, text, token);
        setMessages(prev => [...prev, message]);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      }

      // Stop typing indicator
      if (socket && socket.connected) {
        chatService.stopTyping(conversationId);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      webAlert('Error', 'Failed to send message. Please try again.');
      // Restore message text on error
      setMessageText(text);
    }
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);

    if (!conversationId) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim().length > 0) {
      // Start typing
      chatService.startTyping(conversationId);

      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        chatService.stopTyping(conversationId);
      }, 3000);
    } else {
      // Stop typing
      chatService.stopTyping(conversationId);
    }
  };


  const getOtherUser = () => {
    if (!conversation || conversation.type === 'group') return null;
    return conversation.participants.find(p => p.userId !== user?.id);
  };

  const getDisplayName = () => {
    if (!conversation) return '';
    if (conversation.type === 'group') return conversation.name || 'Group Chat';
    const otherUser = getOtherUser();
    return otherUser?.userName || 'Unknown';
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;
    const showAvatar = !isMyMessage && conversation?.type === 'group';

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}
      >
        {showAvatar && (
          <View style={styles.messageAvatarContainer}>
            {item.senderAvatar ? (
              <Image source={{ uri: item.senderAvatar }} style={styles.messageAvatar} />
            ) : (
              <View style={[styles.messageAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {item.senderName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.messageContent}>
          {!isMyMessage && conversation?.type === 'group' && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}

          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              {item.isEdited && (
                <Text style={[styles.editedText, isMyMessage && styles.editedTextMy]}>
                  edited
                </Text>
              )}
              <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
                {formatMessageTime(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getDisplayName()}
          </Text>
          {conversation?.type === 'group' && (
            <Text style={styles.headerSubtitle}>
              {conversation.participants.length} members
            </Text>
          )}
        </View>

        {conversation?.type === 'dm' && getOtherUser() && (
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => {
              const otherUser = getOtherUser();
              if (otherUser) {
                setSelectedUserId(otherUser.userId);
                setShowProfileModal(true);
              }
            }}
          >
            <Ionicons name="person-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        )}

      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={5000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={20}
              color={messageText.trim() ? '#FFFFFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Profile Modal */}
      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={selectedUserId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatarContainer: {
    marginRight: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  editedText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  editedTextMy: {
    color: '#DBEAFE',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  myMessageTime: {
    color: '#DBEAFE',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
});

