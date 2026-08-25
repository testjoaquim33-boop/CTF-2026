import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../src/theme/ThemeProvider';
import { Text } from '../src/components';
import { fetchLatestWeight, logBodyWeight } from '../src/services/body';
import { useT } from '../src/i18n/useT';

export default function WeighInScreen() {
  const t = useTheme();
  const tr = useT();
  const qc = useQueryClient();
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [last, setLast] = useState<{ weightKg: number; date: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const w = await fetchLatestWeight();
      if (w) { setLast({ weightKg: w.weightKg, date: w.date }); if (!weight) setWeight(String(w.weightKg)); }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nudge = (delta: number) => {
    const cur = parseFloat(weight.replace(',', '.')) || last?.weightKg || 70;
    setWeight(String(Math.round((cur + delta) * 10) / 10));
  };

  const save = async () => {
    const w = parseFloat(weight.replace(',', '.'));
    if (!(w >= 20 && w <= 500)) { Alert.alert(tr('common.error'), tr('weigh.invalid')); return; }
    const f = fat ? parseFloat(fat.replace(',', '.')) : null;
    setSaving(true);
    const res = await logBodyWeight(w, { bodyFatPct: f });
    setSaving(false);
    if (!res.ok) { Alert.alert(tr('common.error'), res.error ?? 'unknown'); return; }
    // Rafraîchit les écrans qui affichent le poids.
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['progress'] });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.bgCard,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: t.colors.text, letterSpacing: -0.5 }}>{tr('weigh.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator color={t.colors.primary} /> : (
          last ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time-outline" size={15} color={t.colors.textMuted} />
              <Text color="textSecondary" variant="caption">{tr('weigh.last', { w: last.weightKg, d: last.date })}</Text>
            </View>
          ) : (
            <Text color="textSecondary" variant="caption">{tr('weigh.first')}</Text>
          )
        )}

        {/* Grand champ de poids */}
        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', gap: 16 }}>
          <Text variant="overline" color="textMuted">{tr('weigh.weightKg')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            <TextInput
              value={weight} onChangeText={setWeight} keyboardType="decimal-pad"
              placeholder="—" placeholderTextColor={t.colors.textMuted} autoFocus
              style={{ color: t.colors.text, fontSize: 56, fontWeight: '900', letterSpacing: -2, minWidth: 120, textAlign: 'center' }}
            />
            <Text style={{ color: t.colors.textMuted, fontSize: 22, fontWeight: '800', paddingBottom: 12 }}>kg</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[-1, -0.1, 0.1, 1].map((d) => (
              <Pressable key={d} onPress={() => nudge(d)}
                style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
                  backgroundColor: t.colors.bgInput, borderWidth: 1, borderColor: t.colors.border }}>
                <Text style={{ color: t.colors.text, fontWeight: '800', fontSize: 13 }}>{d > 0 ? `+${d}` : d}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Masse grasse (optionnel) */}
        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: t.colors.border, gap: 8 }}>
          <Text variant="overline" color="textMuted">{tr('weigh.bodyFat')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={fat} onChangeText={setFat} keyboardType="decimal-pad"
              placeholder={tr('weigh.optional')} placeholderTextColor={t.colors.textMuted}
              style={{ flex: 1, backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '700' }}
            />
            <Text style={{ color: t.colors.textMuted, fontSize: 16, fontWeight: '800' }}>%</Text>
          </View>
        </View>

        <Pressable onPress={save} disabled={saving} style={{ borderRadius: 16, overflow: 'hidden', opacity: saving ? 0.7 : 1, marginTop: 4 }}>
          <LinearGradient colors={[t.colors.primary, t.colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="save" size={19} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{saving ? tr('weigh.saving') : tr('weigh.save')}</Text>
          </LinearGradient>
        </Pressable>

        <Text color="textMuted" variant="caption" style={{ textAlign: 'center' }}>{tr('weigh.hint')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
