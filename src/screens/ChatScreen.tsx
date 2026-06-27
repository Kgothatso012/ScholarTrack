import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { supabase, Profile, Driver, Child } from '../lib/api';
import { ThemeColors } from '../context/ThemeContext';

import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('dark');

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface ChatConversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_role: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function ChatScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadConversations = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);

      // Get messages where current user is sender or receiver
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      // Group by conversation partner
      const convMap = new Map<string, ChatConversation>();

      (messages || []).forEach((msg: Message) => {
        const partnerId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;

        if (!convMap.has(partnerId)) {
          // Get partner info
          supabase.from('profiles').select('*').eq('id', partnerId).single()
            .then(({ data: profile }) => {
              const name = profile?.full_name || 'Unknown';
              const role = profile?.role || 'user';
              convMap.set(partnerId, {
                id: partnerId,
                participant_id: partnerId,
                participant_name: name,
                participant_role: role,
                last_message: msg.message,
                last_message_at: msg.created_at,
                unread_count: msg.receiver_id === currentUser.id && !msg.is_read ? 1 : 0
              });
              setConversations(Array.from(convMap.values()));
            });
        } else {
          const conv = convMap.get(partnerId)!;
          if (msg.receiver_id === currentUser.id && !msg.is_read) {
            conv.unread_count++;
          }
        }
      });

      // Also get drivers available for this parent
      if (currentUser.role === 'parent') {
        const { data: children } = await supabase
          .from('children')
          .select('driver_id')
          .eq('parent_id', currentUser.id);

        const driverIds = (children || []).map((c: { driver_id?: string }) => c.driver_id).filter((id): id is string => !!id);

        for (const driverId of driverIds) {
          if (!convMap.has(driverId)) {
            const { data: driver } = await supabase
              .from('drivers')
              .select('*')
              .eq('id', driverId)
              .single();

            if (driver) {
              convMap.set(driverId, {
                id: driverId,
                participant_id: driverId,
                participant_name: driver.full_name || 'Driver',
                participant_role: 'driver',
                last_message: '',
                last_message_at: new Date().toISOString(),
                unread_count: 0
              });
            }
          }
        }
      }

      setConversations(Array.from(convMap.values()).sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentUser || !selectedChat) return;
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.participant_id}),and(sender_id.eq.${selectedChat.participant_id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      setMessages(data || []);

      // Mark as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUser.id)
        .eq('sender_id', selectedChat.participant_id);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedChat) return;

    try {
      setSending(true);
      const { error } = await supabase.from('chat_messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedChat.participant_id,
        message: newMessage.trim(),
        is_read: false
      });

      if (error) throw error;

      setNewMessage('');
      loadMessages();
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const startConversation = (participantId: string, name: string, role: string) => {
    const conv: ChatConversation = {
      id: participantId,
      participant_id: participantId,
      participant_name: name,
      participant_role: role,
      last_message: '',
      last_message_at: new Date().toISOString(),
      unread_count: 0
    };
    setSelectedChat(conv);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    return (
      <Animated.View entering={FadeIn.delay(index * 30).springify()} style={[styles(colors).messageBubble, isMyMessage ? styles(colors).myMessage : styles(colors).theirMessage]}>
        <Text style={[styles(colors).messageText, isMyMessage ? { color: colors.text } : { color: colors.text }]}>
          {item.message}
        </Text>
        <Text style={[styles(colors).messageTime, isMyMessage ? { color: '#fff8' } : { color: colors.textSecondary }]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Animated.View>
    );
  };

  if (loading && !selectedChat) {
    return (
      <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (selectedChat) {
    return (
      <KeyboardAvoidingView
        style={[styles(colors).container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles(colors).backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <View style={styles(colors).headerInfo}>
            <Text style={styles(colors).headerName}>{selectedChat.participant_name}</Text>
            <Text style={styles(colors).headerRole}>{selectedChat.participant_role}</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles(colors).messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Input */}
        <View style={[styles(colors).inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles(colors).input, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={styles(colors).sendBtn}
            onPress={sendMessage}
            disabled={sending || !newMessage.trim()}
          >
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Messages</Text>
      </View>

      {/* Conversations */}
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles(colors).convItem, { borderColor: colors.border }]}
            onPress={() => setSelectedChat(item)}
          >
            <View style={[styles(colors).convAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles(colors).convInfo}>
              <View style={styles(colors).convHeader}>
                <Text style={[styles(colors).convName, { color: colors.text }]}>{item.participant_name}</Text>
                <Text style={[styles(colors).convTime, { color: colors.textSecondary }]}>
                  {new Date(item.last_message_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles(colors).convRole, { color: colors.textSecondary }]}>{item.participant_role}</Text>
              {item.last_message && (
                <Text style={[styles(colors).convLast, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.last_message}
                </Text>
              )}
            </View>
            {item.unread_count > 0 && (
              <View style={[styles(colors).unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles(colors).unreadText}>{item.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles(colors).emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles(colors).emptyText, { color: colors.textSecondary }]}>No conversations yet</Text>
            <Text style={[styles(colors).emptySubtext, { color: colors.textSecondary }]}>
              Start chatting with your driver
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.textInverse, marginLeft: 10 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  headerRole: { fontSize: 12, color: colors.primary },
  messagesList: { padding: 15 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: C.info },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: colors.card },
  messageText: { fontSize: 15 },
  messageTime: { fontSize: 10, marginTop: 4 },
  inputContainer: { flexDirection: 'row', padding: 10, alignItems: 'flex-end' },
  input: { flex: 1, padding: 12, borderRadius: 20, fontSize: 15, maxHeight: 100, backgroundColor: colors.surface },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8, backgroundColor: C.primary },
  convItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border },
  convAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  convInfo: { flex: 1, marginLeft: 12 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  convName: { fontSize: 16, fontWeight: '600' },
  convTime: { fontSize: 12 },
  convRole: { fontSize: 12, marginTop: 2 },
  convLast: { fontSize: 13, marginTop: 4 },
  unreadBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  unreadText: { color: C.textInverse, fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtext: { fontSize: 14, marginTop: 5 }
});
