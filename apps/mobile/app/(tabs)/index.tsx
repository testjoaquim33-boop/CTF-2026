import React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Ring, HexBadge, LineChart, AmbientOrbs } from '../../src/components';
import { fetchDashboard, type Dashboard } from '../../src/services/dashboard';
import { useT } from '../../src/i18n/useT';
import { useLocalized } from '../../src/i18n/useLocalized';


export default function DashboardScreen() {
  const t = useTheme();
  const tr = useT();
  const { exName } = useLocalized();
  const { width } = useWindowDimensions();
  const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.colors.primary} /></SafeAreaView>;
  }
  const d = data as Dashboard;
  const weightPct = (d.currentWeightKg != null && d.targetWeightKg != null && d.startWeightKg != null && d.startWeightKg !== d.targetWeightKg)
    ? Math.max(0, Math.min(1, Math.abs(d.currentWeightKg - d.startWeightKg) / Math.abs(d.targetWeightKg - d.startWeightKg))) : 0;
  const toGo = (d.currentWeightKg != null && d.targetWeightKg != null) ? Math.round((d.targetWeightKg - d.currentWeightKg) * 10) / 10 : null;
  const dayLetters = tr('home.days').split(',');

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AmbientOrbs colors={[t.colors.primary, t.colors.secondary, t.colors.info]} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}>

          {/* HEADER : avatar + salut + streak */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <LinearGradient colors={[t.colors.secondary, t.colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#0A0A12' }}>{(d.displayName ?? '?').trim().charAt(0).toUpperCase() || '?'}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, lineHeight: 24, fontWeight: '800', color: t.colors.text, letterSpacing: -0.4 }} numberOfLines={1}>{tr('home.greeting', { name: d.displayName })}</Text>
              <Text color="textMuted" style={{ fontWeight: '600', fontSize: 13 }}>{tr('home.subtitle')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 38, borderRadius: 14,
              backgroundColor: t.colors.primary + '22', borderWidth: 1, borderColor: t.colors.primary + '66' }}>
              <Text style={{ fontSize: 14 }}>🔥</Text>
              <Text style={{ fontWeight: '900', fontSize: 15, color: t.colors.text }}>{d.streak}</Text>
            </View>
          </View>

          {/* LEVEL HERO */}
          <LinearGradient colors={[t.colors.primary, t.colors.pink, t.colors.secondary]} locations={[0, 0.52, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 20, overflow: 'hidden',
              shadowColor: t.colors.primary, shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <HexBadge level={d.level} size={72} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, color: '#FFFFFFDD' }}>{tr('home.level', { level: d.level, title: d.title.toUpperCase() })}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                  <Text style={{ fontSize: 42, lineHeight: 46, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5 }}>{d.xp}</Text>
                  <Text style={{ marginBottom: 8, fontWeight: '800', color: '#FFFFFFCC' }}>{tr('home.xp')}</Text>
                </View>
                <View style={{ height: 9, backgroundColor: '#00000044', borderRadius: 999, overflow: 'hidden' }}>
                  <LinearGradient colors={['#FFFFFF', '#FFE29A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 9, width: `${Math.max(4, d.progress * 100)}%`, borderRadius: 999 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text variant="caption" style={{ color: '#FFFFFFDD', fontWeight: '700' }}>{d.xp} / {d.nextXp ?? '∞'} XP</Text>
                  <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '800' }}>{d.nextXp ? tr('home.nextLevel', { level: d.level + 1 }) : tr('home.max')}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* NEXT SESSION */}
          <NextSession minutes={d.sessionMinutes} />

          {/* STAT TILES — une couleur par stat */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatTile icon="barbell" color={t.colors.cyan} value={String(d.totalWorkouts)} label={tr('home.statWorkouts')} />
            <StatTile icon="calendar" color={t.colors.lime} value={String(d.weekWorkouts)} label={tr('home.statWeek')} />
            <StatTile icon="trophy" color={t.colors.primary} value={String(d.recentPRs.length)} label={tr('home.statRecords')} />
          </View>

          {/* COACH IA */}
          <Pressable onPress={() => router.push('/coach/chat')}>
            <LinearGradient colors={[t.colors.cyan, t.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 2 }}>
              <View style={{ borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.colors.bgCard }}>
                <LinearGradient colors={[t.colors.cyan, t.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="sparkles" size={22} color="#0A0A12" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.colors.text, fontWeight: '800', fontSize: 16, lineHeight: 20 }}>{tr('home.coachTitle')}</Text>
                  <Text style={{ color: t.colors.textMuted, fontSize: 12.5, lineHeight: 17, fontWeight: '600' }}>{tr('home.coachSub')}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={t.colors.cyan} />
              </View>
            </LinearGradient>
          </Pressable>

          {/* WEEK STRIP */}
          <Widget title={tr('home.weekTitle')} right={`${d.last7.filter((x) => x.trained).length} / 7`} rightColor={t.colors.lime}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              {d.last7.map((day, i) => {
                const isToday = i === 6, on = day.trained;
                return (
                  <View key={i} style={{ width: 36, height: 36, borderRadius: 12,
                    backgroundColor: on ? t.colors.lime : 'transparent',
                    borderWidth: on ? 0 : 1.5, borderColor: isToday ? t.colors.primary : t.colors.border,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: t.colors.lime, shadowOpacity: on ? 0.6 : 0, shadowRadius: 8, elevation: on ? 4 : 0 }}>
                    <Text variant="caption" style={{ fontWeight: '900', color: on ? '#0B0B0B' : (isToday ? t.colors.primary : t.colors.textMuted) }}>
                      {on ? '✓' : dayLetters[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Widget>

          {/* PROGRESSION */}
          <Widget title={tr('home.progression')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: t.colors.textMuted }}>{tr('home.currentWeight')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
                  <Text style={{ fontSize: 38, lineHeight: 44, fontWeight: '800', color: t.colors.text, letterSpacing: -1 }}>{d.currentWeightKg ?? '—'}</Text>
                  <Text color="textSecondary" style={{ marginBottom: 7, fontWeight: '700' }}>kg</Text>
                </View>
                <Text color="textSecondary">{tr('home.objective')} <Text style={{ color: t.colors.primary }}>{d.targetWeightKg ?? '—'} kg</Text></Text>
                {toGo != null ? <Text style={{ color: t.colors.success, marginTop: 4, fontWeight: '600' }}>{tr('home.toGo', { v: `${toGo > 0 ? '+' : ''}${toGo}` })}</Text> : null}
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
                <Text style={{ flex: 1 }}>{exName(pr)} <Text color="textMuted" variant="caption">({tr(`pr.${pr.type}`) !== `pr.${pr.type}` ? tr(`pr.${pr.type}`) : pr.type})</Text></Text>
                <Text color="primary" style={{ fontWeight: '800' }}>{pr.value} {pr.unit}</Text>
              </View>
            ))}
          </Widget>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function NextSession({ minutes }: { minutes: number | null }) {
  const t = useTheme();
  const tr = useT();
  return (
    <Pressable onPress={() => router.push('/workout/new')} style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.border,
      shadowColor: t.colors.secondary, shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}>
      <LinearGradient colors={['#151228', '#221A3D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
        {/* lueur violette en haut à droite */}
        <LinearGradient colors={[t.colors.secondary + '55', 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.9 }}
          style={StyleSheet.absoluteFillObject} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: t.colors.secondary }}>{tr('home.nextSession')}</Text>
            <Text style={{ fontSize: 22, lineHeight: 27, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 2 }}>{tr('home.startSession')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 7 }}>
              <Row icon="time-outline" label={minutes ? tr('home.minutes', { n: minutes }) : tr('home.atYourPace')} />
              <Row icon="barbell-outline" label={tr('home.freeSession')} />
            </View>
          </View>
          <LinearGradient colors={[t.colors.primary, t.colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
              shadowColor: t.colors.primary, shadowOpacity: 0.7, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
            <Ionicons name="play" size={24} color="#fff" style={{ marginLeft: 3 }} />
          </LinearGradient>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function Row({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name={icon} size={15} color={t.colors.textSecondary} />
      <Text variant="caption" style={{ color: t.colors.textSecondary, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function StatTile({ icon, color, value, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bgCard, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: color + '26', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={{ fontSize: 27, lineHeight: 30, fontWeight: '900', color, letterSpacing: -1, marginTop: 10 }}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: t.colors.textMuted, textTransform: 'uppercase', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function Widget({ title, right, rightColor, children }: { title: string; right?: string; rightColor?: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: t.colors.textMuted }}>{title.toUpperCase()}</Text>
        {right ? <Text style={{ fontWeight: '800', fontSize: 13, color: rightColor ?? t.colors.textMuted }}>{right}</Text> : null}
      </View>
      {children}
    </View>
  );
}
