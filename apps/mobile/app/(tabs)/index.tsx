import React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Pressable, ImageBackground, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Ring, HexBadge, LineChart } from '../../src/components';
import { fetchDashboard, type Dashboard } from '../../src/services/dashboard';

const PR_LABELS: Record<string, string> = { est_1rm: '1RM est.', max_weight: 'Charge', max_reps: 'Reps', max_volume: 'Volume' };
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function DashboardScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.colors.primary} /></SafeAreaView>;
  }
  const d = data as Dashboard;
  const weightPct = (d.currentWeightKg != null && d.targetWeightKg != null && d.startWeightKg != null && d.startWeightKg !== d.targetWeightKg)
    ? Math.max(0, Math.min(1, Math.abs(d.currentWeightKg - d.startWeightKg) / Math.abs(d.targetWeightKg - d.startWeightKg))) : 0;
  const toGo = (d.currentWeightKg != null && d.targetWeightKg != null) ? Math.round((d.targetWeightKg - d.currentWeightKg) * 10) / 10 : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg, paddingBottom: t.spacing.xxl }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}>

        {/* HEADER */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text variant="h1">Bonjour {d.displayName} 👋</Text>
            <Text color="textSecondary">Prêt à devenir la meilleure version de toi-même ?</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications-outline" size={20} color={t.colors.textSecondary} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.border, borderRadius: 999, paddingHorizontal: 10, height: 40 }}>
              <Text>🔥</Text><Text variant="bodyMedium">{d.streak}</Text>
            </View>
          </View>
        </View>

        {/* LEVEL CARD (gradient + hexagon + flame) */}
        <LinearGradient colors={['#3A2216', '#1B1622']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.9 }}
          style={{ borderRadius: t.radius.lg, padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.primary + '44' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
            <HexBadge level={d.level} />
            <View style={{ flex: 1 }}>
              <Text variant="overline" style={{ color: t.colors.primaryMuted }}>NIVEAU {d.level} · {d.title.toUpperCase()}</Text>
              <Text variant="display">{d.xp} <Text variant="h3" color="textSecondary">XP</Text></Text>
              <View style={{ height: 8, backgroundColor: '#00000044', borderRadius: 999, marginTop: 6 }}>
                <View style={{ height: 8, width: `${Math.max(4, d.progress * 100)}%`, backgroundColor: t.colors.primary, borderRadius: 999 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text variant="caption" color="textSecondary">{d.xp} / {d.nextXp ?? '∞'} XP</Text>
                <Text variant="caption" style={{ color: t.colors.primaryMuted }}>{d.nextXp ? `Niveau ${d.level + 1}` : 'MAX'}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🔥</Text>
              </View>
              <Text variant="bodyMedium" style={{ marginTop: 4 }}>{d.streak}</Text>
              <Text variant="caption" color="textMuted">jours</Text>
            </View>
          </View>
        </LinearGradient>

        <NextSession minutes={d.sessionMinutes} />

        {/* STAT TILES */}
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <StatTile icon="barbell" color={t.colors.secondary} value={String(d.totalWorkouts)} label="Séances" sub="total" />
          <StatTile icon="calendar" color={t.colors.success} value={String(d.weekWorkouts)} label="Cette semaine" sub="séances" />
          <StatTile icon="star" color={t.colors.warning} value={String(d.recentPRs.length)} label="Records" sub="récents" />
        </View>

        {/* TA SEMAINE */}
        <Widget title="Ta semaine" right={`${d.last7.filter((x) => x.trained).length} / 7 séances`}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: t.spacing.md }}>
            {d.last7.map((day, i) => {
              const isToday = i === 6;
              const on = day.trained;
              return (
                <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19,
                    backgroundColor: on ? t.colors.primary : t.colors.bgInput,
                    borderWidth: isToday && !on ? 2 : 0, borderColor: t.colors.primary,
                    alignItems: 'center', justifyContent: 'center' }}>
                    <Text variant="caption" color={on ? 'onPrimary' : 'textSecondary'} style={{ fontWeight: '700' }}>
                      {on ? '✓' : DAY_LETTERS[i]}
                    </Text>
                  </View>
                  <Text variant="caption" color="textMuted">{DAY_LETTERS[i]}</Text>
                </View>
              );
            })}
          </View>
        </Widget>

        {/* PROGRESSION : ring + line chart */}
        <Widget title="Ta progression">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: t.spacing.md, gap: t.spacing.lg }}>
            <View style={{ flex: 1 }}>
              <Text variant="overline" color="textMuted">POIDS ACTUEL</Text>
              <Text variant="h1">{d.currentWeightKg ?? '—'} <Text variant="h3" color="textSecondary">kg</Text></Text>
              <Text color="textSecondary">Objectif : <Text style={{ color: t.colors.primary }}>{d.targetWeightKg ?? '—'} kg</Text></Text>
              {toGo != null ? <Text style={{ color: t.colors.success, marginTop: 4 }}>{toGo > 0 ? '+' : ''}{toGo} kg à atteindre</Text> : null}
            </View>
            <Ring progress={weightPct} size={96} color={t.colors.primary} />
          </View>
          <View style={{ marginTop: t.spacing.md }}>
            <LineChart values={d.weightSeries} width={width - t.spacing.lg * 4} />
          </View>
        </Widget>

        {/* RECORDS */}
        <Widget title="Records récents">
          {d.recentPRs.length === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginTop: t.spacing.sm }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.warning + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="trophy" size={20} color={t.colors.warning} />
              </View>
              <Text color="textSecondary" style={{ flex: 1 }}>Termine une séance pour décrocher tes premiers records 💪</Text>
            </View>
          ) : d.recentPRs.map((pr, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text>{pr.exerciseName} <Text color="textMuted" variant="caption">({PR_LABELS[pr.type] ?? pr.type})</Text></Text>
              <Text color="primary" variant="bodyMedium">{pr.value} {pr.unit}</Text>
            </View>
          ))}
        </Widget>
      </ScrollView>
    </SafeAreaView>
  );
}

function NextSession({ minutes }: { minutes: number | null }) {
  const t = useTheme();
  const [imgError, setImgError] = useState(false);
  const heroUri = 'https://yoaxsshvfkmzsamlxati.supabase.co/storage/v1/object/public/exercise-media/_hero.jpg';

  const Content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: t.spacing.lg }}>
      <View style={{ flex: 1 }}>
        <Text variant="overline" style={{ color: '#FFFFFFAA' }}>PROCHAINE SÉANCE</Text>
        <Text variant="h2" color="onPrimary">Démarrer une séance</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={15} color="#FFFFFFDD" />
            <Text variant="caption" style={{ color: '#FFFFFFDD' }}>{minutes ? `~${minutes} min` : 'À ton rythme'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="barbell-outline" size={15} color="#FFFFFFDD" />
            <Text variant="caption" style={{ color: '#FFFFFFDD' }}>Séance libre</Text>
          </View>
        </View>
      </View>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 999, width: 54, height: 54, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="play" size={26} color={t.colors.secondary} />
      </View>
    </View>
  );

  return (
    <Pressable onPress={() => router.push('/workout/new')} style={{ borderRadius: t.radius.lg, overflow: 'hidden' }}>
      {!imgError ? (
        <ImageBackground source={{ uri: heroUri }} onError={() => setImgError(true)} style={{ minHeight: 130, justifyContent: 'center' }}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#5B3FD6CC' }]} />
          {Content}
        </ImageBackground>
      ) : (
        <LinearGradient colors={[t.colors.secondary, t.colors.secondaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minHeight: 130, justifyContent: 'center' }}>
          <Ionicons name="body" size={130} color="#FFFFFF14" style={{ position: 'absolute', right: -10, top: -6 }} />
          {Content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

function StatTile({ icon, color, value, label, sub }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string; sub: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bgCard, borderRadius: t.radius.lg, padding: t.spacing.md, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginBottom: t.spacing.sm }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text variant="h2">{value}</Text>
      <Text variant="caption" color="textSecondary">{label}</Text>
      <Text variant="caption" color="textMuted">{sub}</Text>
    </View>
  );
}
function Widget({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.lg, padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="overline" color="textMuted">{title.toUpperCase()}</Text>
        {right ? <Text variant="caption" color="textMuted">{right}</Text> : null}
      </View>
      {children}
    </View>
  );
}
