// AI Support Chat Component
// Connects to OpenClaw gateway for AI support

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../services/ai';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('dark');

type ThemeColors = typeof C;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  darkMode?: boolean;
}

export default function AIChat({ darkMode = false }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m ScholarTrack AI Assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await aiService.getSupportResponse(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles(C).messageBubble,
        item.role === 'user'
          ? { alignSelf: 'flex-end', backgroundColor: C.primary }
          : { alignSelf: 'flex-start', backgroundColor: C.card },
      ]}
    >
      <Text
        style={[
          styles(C).messageText,
          { color: item.role === 'user' ? C.textInverse : C.text },
        ]}
      >
        {item.content}
      </Text>
      <Text
        style={[
          styles(C).timestamp,
          { color: item.role === 'user' ? `${C.textInverse}88` : C.textMuted },
        ]}
      >
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles(C).container, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles(C).header, { backgroundColor: C.primary }]}>
        <Ionicons name="chatbubbles" size={24} color={C.textInverse} />
        <Text style={styles(C).headerText}>AI Support</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles(C).messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {loading && (
        <View style={styles(C).loadingContainer}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={[styles(C).loadingText, { color: C.textMuted }]}>Thinking...</Text>
        </View>
      )}

      <View style={[styles(C).inputContainer, { backgroundColor: C.card }]}>
        <TextInput
          style={[styles(C).input, { backgroundColor: C.inputBg, color: C.text }]}
          placeholder="Type your message..."
          placeholderTextColor={C.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          accessibilityLabel="Message input"
          accessibilityHint="Type your question for AI support"
        />
        <TouchableOpacity
          style={[styles(C).sendButton, { backgroundColor: C.primary }]}
          onPress={sendMessage}
          disabled={loading || !inputText.trim()}
          accessibilityLabel="Send message"
        >
          <Ionicons name="send" size={20} color={C.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  headerText: {
    color: colors.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});