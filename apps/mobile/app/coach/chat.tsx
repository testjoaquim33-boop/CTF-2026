import React, { useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text } from '../../src/components';
import { sendChatMessage } from '../../src/services/chat';
import { useT } from '../../src/i18n/useT';
import type { ChatMessage } from '@project_fit/shared';

interface Bubble extends ChatMessage { id: string }

export default function CoachChatScreen() {
  const t = useTheme();
  const tr = useT();
  const SUGGESTIONS = [tr('chat.s1'), tr('chat.s2'), tr('chat.s3'), tr('chat.s4')];
  const [bubbles, setBubbles] = useState<Bubble[]>(() => [
    { id: 'greet', role: 'assistant', content: tr('chat.greeting') },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    setInput('');

    const userBubble: Bubble = { id: `u${Date.now()}`, role: 'user', content };
    const next = [...bubbles, userBubble];
    setBubbles(next);
    setLoading(true);
    scrollToEnd();

    // Historique envoyé = messages réels (on retire le greeting synthétique).
    const history: ChatMessage[] = next
      .filter((b) => b.id !== 'greet')
      .map((b) => ({ role: b.role, content: b.content }));

    const res = await sendChatMessage(history);
    setLoading(false);

    if (!res.ok) {
      const key = `chat.err.${res.error ?? 'generic'}`;
      const msg = tr(key);
      setError(msg === key ? (res.error ?? tr('chat.err.generic')) : msg);
      scrollToEnd();
      return;
    }
    setBubbles((prev) => [...prev, { id: `a${Date.now()}`, role: 'assistant', content: res.reply ?? '' }]);
    scrollToEnd();
  };

  const showSuggestions = bubbles.length <= 1 && !loading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md,
        padding: t.spacing.lg, paddingBottom: t.spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.border }}>
        <Pressable onPress={() => router.back()} hitSlop={12}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.bgCard,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        </Pressable>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.primary + '22',
          alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.primary + '55' }}>
          <Ionicons name="sparkles" size={20} color={t.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h3">{tr('chat.title')}</Text>
          <Text variant="caption" color="textSecondary">{tr('chat.subtitle')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md }}
          onContentSizeChange={scrollToEnd} keyboardShouldPersistTaps="handled">
          {bubbles.map((b) => <MsgBubble key={b.id} b={b} />)}

          {loading ? (
            <View style={{ alignSelf: 'flex-start', backgroundColor: t.colors.bgCard, borderRadius: t.radius.lg,
              paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md, borderWidth: 1, borderColor: t.colors.border }}>
              <ActivityIndicator color={t.colors.primary} />
            </View>
          ) : null}

          {error ? (
            <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.md,
              borderWidth: 1, borderColor: t.colors.warning + '66' }}>
              <Text color="warning" variant="caption">{error}</Text>
            </View>
          ) : null}

          {showSuggestions ? (
            <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
              <Text variant="overline" color="textMuted">{tr('chat.suggestions')}</Text>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => send(s)}
                  style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.md,
                    borderWidth: 1, borderColor: t.colors.border }}>
                  <Text variant="caption">{s}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Barre de saisie */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.spacing.sm,
          padding: t.spacing.md, borderTopWidth: 1, borderTopColor: t.colors.border, backgroundColor: t.colors.bg }}>
          <TextInput
            value={input} onChangeText={setInput}
            placeholder={tr('chat.placeholder')} placeholderTextColor={t.colors.textMuted}
            multiline
            style={{ flex: 1, maxHeight: 120, backgroundColor: t.colors.bgInput, color: t.colors.text,
              borderRadius: t.radius.lg, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm, fontSize: 16 }}
          />
          <Pressable onPress={() => send(input)} disabled={loading || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
              backgroundColor: input.trim() && !loading ? t.colors.primary : t.colors.bgInput }}>
            <Ionicons name="arrow-up" size={22} color={input.trim() && !loading ? t.colors.onPrimary : t.colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MsgBubble({ b }: { b: Bubble }) {
  const t = useTheme();
  const isUser = b.role === 'user';
  return (
    <View style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '86%',
      backgroundColor: isUser ? t.colors.primary : t.colors.bgCard,
      borderRadius: t.radius.lg,
      borderBottomRightRadius: isUser ? 4 : t.radius.lg,
      borderBottomLeftRadius: isUser ? t.radius.lg : 4,
      paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md,
      borderWidth: isUser ? 0 : 1, borderColor: t.colors.border,
    }}>
      <Text style={{ color: isUser ? t.colors.onPrimary : t.colors.text, lineHeight: 22 }}>{b.content}</Text>
    </View>
  );
}
