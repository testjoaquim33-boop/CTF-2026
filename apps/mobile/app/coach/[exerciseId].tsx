import React, { useState } from 'react';
import { View, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { requestRecommendation, type AiRecommendation } from '../../src/services/ai';

const ERR_LABELS: Record<string, string> = {
  quota_exceeded: 'Tu as atteint ta limite IA de la semaine. Passe Premium pour plus de recommandations.',
  ai_not_configured: "L'IA n'est pas encore configurée côté serveur.",
  unauthorized: 'Session expirée, reconnecte-toi.',
};

export default function CoachScreen() {
  const t = useTheme();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<AiRecommendation | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const ask = async () => {
    setLoading(true); setRec(null); setMsg(null);
    const res = await requestRecommendation(exerciseId ?? '', note);
    setLoading(false);
    if (!res.ok) { setMsg(ERR_LABELS[res.error ?? ''] ?? res.error ?? 'Erreur'); return; }
    if (res.safetyNotice) { setMsg(res.safetyNotice); return; }
    setRec(res.recommendation ?? null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md }}>
        <Text variant="h1">AI Coach</Text>
        <Text color="textSecondary">Recommandation basée sur ton historique réel pour cet exercice.</Text>

        <TextInput
          placeholder="Une note ? (fatigue, ressenti…)"
          placeholderTextColor={t.colors.textMuted}
          value={note} onChangeText={setNote}
          style={{ backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.md, padding: t.spacing.md }}
        />
        <Button label={loading ? 'Analyse…' : 'Obtenir une recommandation'} onPress={ask} disabled={loading} />

        {loading ? <ActivityIndicator color={t.colors.primary} /> : null}
        {msg ? <Text color="warning" style={{ marginTop: t.spacing.md }}>{msg}</Text> : null}

        {rec ? (
          <View style={{ backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md, padding: t.spacing.lg,
            borderWidth: 1, borderColor: t.colors.border, marginTop: t.spacing.md, gap: t.spacing.sm }}>
            <Text variant="h2" color="primary">
              {rec.suggested_weight_kg} kg
            </Text>
            <Text variant="bodyMedium">
              {rec.suggested_sets} × {rec.suggested_reps_min}-{rec.suggested_reps_max} reps · repos {rec.rest_seconds}s
            </Text>
            <Text color="textSecondary">{rec.rationale}</Text>
            <Text variant="caption" color="textMuted" style={{ marginTop: t.spacing.sm }}>{rec.disclaimer}</Text>
          </View>
        ) : null}

        <Button label="Retour" variant="secondary" onPress={() => router.back()} style={{ marginTop: t.spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}
