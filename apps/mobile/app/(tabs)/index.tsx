import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Pressable, ImageBackground, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Ring, HexBadge, LineChart, AmbientOrbs } from '../../src/components';
import { fetchDashboard, type Dashboard } from '../../src/services/dashboard';
import { useT } from '../../src/i18n/useT';

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function DashboardScreen() {
  const t = useTheme();
  const tr = useT();
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
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AmbientOrbs colors={[t.colors.primary, t.colors.secondary, t.colors.info]} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}>

          {/* HEADER */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '800', color: t.colors.text, letterSpacing: -0.5 }}>{tr('home.greeting', { name: d.displayName })}</Text>
              <Text color="textSecondary" style={{ marginTop: 2 }}>{tr('home.subtitle')}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: -8 }}>
            <IconChip icon="notifications-outline" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.border, borderRadius: 999, paddingHorizontal: 12, height: 38 }}>
              <Text style={{ fontSize: 14 }}>🔥</Text><Text variant="bodyMedium">{d.streak}</Text>
              <Text variant="caption" color="textMuted">{tr('home.streak')}</Text>
            </View>
          </View>

          {/* LEVEL HERO */}
          <LinearGradient colors={['#3A2216', '#1A1520']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 20, borderWidth: 1, borderColor: t.colors.primary + '3A',
              shadowColor: t.colors.primary, shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <HexBadge level={d.level} size={72} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: t.colors.primaryMuted }}>{tr('home.level', { level: d.level, title: d.title.toUpperCase() })}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                  <Text style={{ fontSize: 40, lineHeight: 46, fontWeight: '800', color: t.colors.text, letterSpacing: -1 }}>{d.xp}</Text>
                  <Text color="textSecondary" style={{ marginBottom: 8, fontWeight: '700' }}>{tr('home.xp')}</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#00000055', borderRadius: 999 }}>
                  <View style={{ height: 8, width: `${Math.max(4, d.progress * 100)}%`, backgroundColor: t.colors.primary, borderRadius: 999 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                  <Text variant="caption" color="textSecondary">{d.xp} / {d.nextXp ?? '∞'} XP</Text>
                  <Text variant="caption" style={{ color: t.colors.primaryMuted }}>{d.nextXp ? tr('home.nextLevel', { level: d.level + 1 }) : tr('home.max')}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* NEXT SESSION */}
          <NextSession minutes={d.sessionMinutes} />

          {/* COACH IA */}
          <Pressable onPress={() => router.push('/coach/chat')}>
            <LinearGradient colors={[t.colors.primary, t.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF22',
                alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 17, lineHeight: 22 }}>{tr('home.coachTitle')}</Text>
                <Text style={{ color: '#FFFFFFCC', fontSize: 13, lineHeight: 18 }}>{tr('home.coachSub')}</Text>
              </View>
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>

          {/* STAT TILES — big numbers, small labels */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatTile icon="barbell" color={t.colors.secondary} value={String(d.totalWorkouts)} label={tr('home.statWorkouts')} />
            <StatTile icon="calendar" color={t.colors.success} value={String(d.weekWorkouts)} label={tr('home.statWeek')} />
            <StatTile icon="trophy" color={t.colors.warning} value={String(d.recentPRs.length)} label={tr('home.statRecords')} />
          </View>

          {/* WEEK STRIP */}
          <Widget title={tr('home.weekTitle')} right={`${d.last7.filter((x) => x.trained).length} / 7`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              {d.last7.map((day, i) => {
                const isToday = i === 6, on = day.trained;
                return (
                  <View key={i} style={{ alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19,
                      backgroundColor: on ? t.colors.primary : 'transparent',
                      borderWidth: on ? 0 : 1.5, borderColor: isToday ? t.colors.primary : t.colors.border,
                      alignItems: 'center', justifyContent: 'center' }}>
                      <Text variant="caption" color={on ? 'onPrimary' : (isToday ? 'primary' : 'textMuted')} style={{ fontWeight: '800' }}>
                        {on ? '✓' : DAY_LETTERS[i]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Widget>

          {/* PROGRESSION */}
          <Widget title="Ta progression">
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: t.colors.textMuted }}>POIDS ACTUEL</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
                  <Text style={{ fontSize: 38, lineHeight: 44, fontWeight: '800', color: t.colors.text, letterSpacing: -1 }}>{d.currentWeightKg ?? '—'}</Text>
                  <Text color="textSecondary" style={{ marginBottom: 7, fontWeight: '700' }}>kg</Text>
                </View>
                <Text color="textSecondary">Objectif : <Text style={{ color: t.colors.primary }}>{d.targetWeightKg ?? '—'} kg</Text></Text>
                {toGo != null ? <Text style={{ color: t.colors.success, marginTop: 4, fontWeight: '600' }}>{toGo > 0 ? '+' : ''}{toGo} kg à atteindre</Text> : null}
              </View>
              <Ring progress={weightPct} size={104} color={t.colors.primary} />
            </View>
            <View style={{ marginTop: 16 }}>
              <LineChart values={d.weightSeries} width={width - 40 - 40} />
            </View>
          </Widget>

          {/* RECORDS */}
          <Widget title={tr('home.recentRecords')}>
            {d.recentPRs.length === 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.colors.warning + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trophy" size={20} color={t.colors.warning} />
                </View>
                <Text color="textSecondary" style={{ flex: 1 }}>{tr('pg.noRecords')}</Text>
              </View>
            ) : d.recentPRs.map((pr, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ flex: 1 }}>{pr.exerciseName} <Text color="textMuted" variant="caption">({tr(`pr.${pr.type}`) !== `pr.${pr.type}` ? tr(`pr.${pr.type}`) : pr.type})</Text></Text>
                <Text color="primary" style={{ fontWeight: '800' }}>{pr.value} {pr.unit}</Text>
              </View>
            ))}
          </Widget>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function IconChip({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  const t = useTheme();
  return (
    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={19} color={t.colors.textSecondary} />
    </View>
  );
}

function NextSession({ minutes }: { minutes: number | null }) {
  const t = useTheme();
  const tr = useT();
  const [imgError, setImgError] = useState(false);
  const heroUri = 'https://yoaxsshvfkmzsamlxati.supabase.co/storage/v1/object/public/exercise-media/_hero.jpg';

  const Content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#FFFFFFAA' }}>{tr('home.nextSession')}</Text>
        <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>{tr('home.startSession')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <Row icon="time-outline" label={minutes ? tr('home.minutes', { n: minutes }) : tr('home.atYourPace')} />
          <Row icon="barbell-outline" label={tr('home.freeSession')} />
        </View>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 999, width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="play" size={26} color={t.colors.secondary} />
      </View>
    </View>
  );

  return (
    <Pressable onPress={() => router.push('/workout/new')} style={{ borderRadius: 22, overflow: 'hidden',
      shadowColor: t.colors.secondary, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}>
      {!imgError ? (
        <ImageBackground source={{ uri: heroUri }} onError={() => setImgError(true)} style={{ minHeight: 132, justifyContent: 'center' }}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#5B3FD6CC' }]} />
          {Content}
        </ImageBackground>
      ) : (
        <LinearGradient colors={[t.colors.secondary, t.colors.secondaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minHeight: 132, justifyContent: 'center' }}>
          <Ionicons name="body" size={140} color="#FFFFFF14" style={{ position: 'absolute', right: -10, top: -6 }} />
          {Content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

function Row({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name={icon} size={15} color="#FFFFFFDD" />
      <Text variant="caption" style={{ color: '#FFFFFFDD' }}>{label}</Text>
    </View>
  );
}

function StatTile({ icon, color, value, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bgCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '800', color: t.colors.text, letterSpacing: -1 }}>{value}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: t.colors.textMuted, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function Widget({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: t.colors.textMuted }}>{title.toUpperCase()}</Text>
        {right ? <Text variant="caption" color="textMuted">{right}</Text> : null}
      </View>
      {children}
    </View>
  );
}
