import React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, MiniBarChart } from '../../src/components';
import { fetchProgressSummary } from '../../src/services/progress';
import { useT } from '../../src/i18n/useT';

function StatTile({ icon, color, label, value }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bgCard, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: color + '26', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={{ fontSize: 24, lineHeight: 28, fontWeight: '900', color, letterSpacing: -1, marginTop: 10 }} numberOfLines={1}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: t.colors.textMuted, textTransform: 'uppercase', marginTop: 2 }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: t.colors.border }}>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: t.colors.textMuted }}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

export default function ProgressScreen() {
  const t = useTheme();
  const tr = useT();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['progress'], queryFn: fetchProgressSummary,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}
      >
        <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '900', color: t.colors.text, letterSpacing: -0.8 }}>{tr('pg.title')}</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatTile icon="barbell" color={t.colors.cyan} label={tr('pg.workouts')} value={String(data?.workoutCount ?? 0)} />
          <StatTile icon="body" color={t.colors.primary} label={tr('pg.currentWeight')} value={data?.currentWeightKg ? `${data.currentWeightKg}` : '—'} />
          <StatTile icon="flag" color={t.colors.lime} label={tr('pg.target')} value={data?.targetWeightKg ? `${data.targetWeightKg}` : '—'} />
        </View>

        <Card title={tr('pg.bodyweight')}>
          <View style={{ marginTop: 14 }}>
            <MiniBarChart values={(data?.bodySeries ?? []).map((b) => b.weightKg)} />
          </View>
        </Card>

        <View>
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: t.colors.textMuted, marginBottom: 12 }}>{tr('pg.recentRecords').toUpperCase()}</Text>
          {(data?.recentPRs ?? []).length === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.bgCard,
              borderRadius: 18, padding: 16, borderWidth: 1, borderColor: t.colors.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.warning + '26', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="trophy" size={19} color={t.colors.warning} />
              </View>
              <Text color="textSecondary" style={{ flex: 1 }}>{tr('pg.noRecords')}</Text>
            </View>
          ) : (
            data!.recentPRs.map((pr, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: t.colors.bgCard, borderRadius: 16, padding: 14,
                marginBottom: 10, borderWidth: 1, borderColor: t.colors.border }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.colors.primary + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="medal" size={18} color={t.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" numberOfLines={1}>{pr.exerciseName}</Text>
                  <Text variant="caption" color="textMuted">{tr(`pr.${pr.type}`) !== `pr.${pr.type}` ? tr(`pr.${pr.type}`) : pr.type}</Text>
                </View>
                <Text style={{ fontWeight: '900', fontSize: 16, color: t.colors.primary }}>{pr.value} {pr.unit}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
