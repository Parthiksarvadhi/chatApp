import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { messageAPI, groupAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/services/socket';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

interface GroupMember {
  id: number;
  username: string;
  status: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const socket = getSocket();

  useEffect(() => {
    loadChatData();
    setupSocketListeners();

    return () => {
      if (socket) {
        socket.emit('leave_group', parseInt(id as string));
      }
    };
  }, [id]);

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.emit('join_group', parseInt(id as string));

    socket.on('new_message', (data: any) => {
      console.log('New message received:', data);
      setMessages((prev) => [
        ...prev,
        {
          id: data.id || Date.now(),
          user_id: data.userId,
          username: data.username || 'Unknown',
          content: data.content,
          created_at: new Date().toISOString(),
        },
      ]);
    });

    socket.on('user_joined', (data: any) => {
      console.log('User joined:', data);
      loadMembers();
    });

    socket.on('user_left', (data: any) => {
      console.log('User left:', data);
      loadMembers();
    });

    socket.on('presence_update', (data: any) => {
      console.log('Presence update:', data);
      loadMembers();
    });
  };

  const loadChatData = async () => {
    try {
      setLoading(true);
      const [groupRes, messagesRes, membersRes] = await Promise.all([
        groupAPI.getGroupDetails(parseInt(id as string)),
        messageAPI.getMessages(parseInt(id as string)),
        groupAPI.getGroupMembers(parseInt(id as string)),
      ]);
      setGroupName(groupRes.data.name);
      setMessages(messagesRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load chat');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await groupAPI.getGroupMembers(parseInt(id as string));
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      const response = await messageAPI.sendMessage(parseInt(id as string), messageText);
      
      console.log('Message response:', response);
      const messageId = response.data?.id || Date.now();

      // Emit via socket for real-time delivery
      if (socket) {
        socket.emit('send_message', {
          groupId: parseInt(id as string),
          message: {
            id: messageId,
            user_id: user?.id || 0,
            username: user?.username || 'You',
            content: messageText,
            created_at: new Date().toISOString(),
          },
        });
      }

      setMessageText('');
      const newMessage: Message = {
        id: messageId,
        user_id: user?.id || 0,
        username: user?.username || 'You',
        content: messageText,
        created_at: new Date().toISOString(),
      };
      
      console.log('Adding message:', newMessage);
      setMessages((prev) => [...prev, newMessage]);

      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.user_id === user?.id;

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          {!isOwnMessage && <Text style={styles.senderName}>{item.username}</Text>}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.content}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderMemberItem = ({ item }: { item: GroupMember }) => (
    <View style={styles.memberBadge}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: item.status === 'online' ? '#34C759' : '#999' },
        ]}
      />
      <Text style={styles.memberName} numberOfLines={1}>
        {item.username}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Members List */}
      <View style={styles.membersContainer}>
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.membersList}
        />
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => (item?.id ? item.id.toString() : `msg-${index}`)}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (sending || !messageText.trim()) && styles.sendBtnDisabled]}
          onPress={handleSendMessage}
          disabled={sending || !messageText.trim()}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  membersList: {
    paddingHorizontal: 12,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  memberName: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    maxWidth: 80,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  otherBubble: {
    backgroundColor: 'white',
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#000',
  },
  ownMessageText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
    color: '#000',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
