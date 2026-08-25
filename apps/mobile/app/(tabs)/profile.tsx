import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text } from '../../src/components';
import { usePremium } from '../../src/hooks/usePremium';
import { useAuthStore } from '../../src/store/auth';
import { useSettings } from '../../src/store/settings';
import { useT } from '../../src/i18n/useT';
import { fetchMyEntries } from '../../src/services/ranking';
import { signOut, deleteAccount } from '../../src/services/auth';
import { supabase } from '../../src/services/supabase';
import { restorePurchases, purchasesEnabled } from '../../src/services/purchases';

export default function ProfileScreen() {
  const t = useTheme();
  const tr = useT();
  const { isPremium, status } = usePremium();
  const user = useAuthStore((s) => s.user);
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('display_name').maybeSingle();
      if (data?.display_name) setName(data.display_name);
    })();
  }, []);

  const saveName = async () => {
    if (!user) return;
    setSavingName(true);
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user.id);
    setSavingName(false);
    Alert.alert(error ? tr('common.error') : tr('common.saved'), error ? error.message : tr('profile.nameSaved'));
  };

  const onLogout = async () => { await signOut(); router.replace('/(auth)/sign-in'); };

  const onDelete = () => {
    Alert.alert(tr('profile.deleteTitle'), tr('profile.deleteMsg'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('profile.delete'), style: 'destructive', onPress: async () => {
        setBusy(true);
        const res = await deleteAccount();
        setBusy(false);
        if (!res.ok) { Alert.alert(tr('common.error'), res.error ?? 'unknown'); return; }
        router.replace('/(auth)/sign-in');
      } },
    ]);
  };

  const onRestore = async () => {
    if (!purchasesEnabled()) { Alert.alert('RevenueCat', tr('profile.restoreSoon')); return; }
    const res = await restorePurchases();
    Alert.alert(res.ok ? tr('profile.restoredTitle') : tr('common.error'), res.ok ? tr('profile.restored') : res.error ?? '');
  };

  const initial = (name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md, paddingBottom: t.spacing.xxl }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '900', color: t.colors.text, letterSpacing: -0.8 }}>{tr('profile.title')}</Text>

        {/* En-tête : avatar + identité */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          <View style={{ width: 62, height: 62, borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient colors={[t.colors.primary, t.colors.pink, t.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{initial}</Text>
            </LinearGradient>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={1}>{name || tr('profile.athlete')}</Text>
            <Text color="textSecondary" variant="caption" numberOfLines={1}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        {/* Mon personnage : meilleur rang */}
        <CharacterCard />

        {/* Carte abonnement */}
        {isPremium ? (
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient colors={[t.colors.primary, t.colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ padding: t.spacing.lg, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>{tr('profile.subscription').toUpperCase()}</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{tr('profile.premium')}</Text>
              <Text style={{ color: '#FFFFFFCC', fontSize: 12 }}>{tr('profile.status', { status })}</Text>
            </LinearGradient>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/paywall')} style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient colors={[t.colors.secondary, t.colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ padding: t.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="rocket" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{tr('profile.goPremium')}</Text>
                <Text style={{ color: '#FFFFFFCC', fontSize: 12 }}>{tr('profile.free')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Sélecteur de langue */}
        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 18, padding: t.spacing.lg,
          borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.sm }}>
          <Text variant="overline" color="textMuted">{tr('profile.language')}</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <LangButton flag="🇫🇷" label="Français" active={lang === 'fr'} onPress={() => setLang('fr')} />
            <LangButton flag="🇬🇧" label="English" active={lang === 'en'} onPress={() => setLang('en')} />
          </View>
        </View>

        {/* Nom affiché */}
        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 18, padding: t.spacing.lg,
          borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.sm }}>
          <Text variant="overline" color="textMuted">{tr('profile.displayName')}</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <TextInput value={name} onChangeText={setName} placeholder={tr('profile.namePlaceholder')} placeholderTextColor={t.colors.textMuted}
              style={{ flex: 1, backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.md, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.md, fontSize: 16 }} />
            <Pressable onPress={saveName} disabled={savingName}
              style={{ paddingHorizontal: t.spacing.lg, borderRadius: t.radius.md, backgroundColor: t.colors.primary,
                alignItems: 'center', justifyContent: 'center', opacity: savingName ? 0.6 : 1 }}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Menu */}
        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: t.colors.border, overflow: 'hidden' }}>
          <MenuRow icon="chatbubbles" tint={t.colors.secondary} label={tr('profile.coachChat')} onPress={() => router.push('/coach/chat')} />
          <Divider />
          <MenuRow icon="ribbon" tint={t.colors.lime} label={tr('profile.badges')} onPress={() => router.push('/achievements')} />
          <Divider />
          <MenuRow icon="flame" tint={t.colors.primary} label={tr('profile.challenges')} onPress={() => router.push('/challenges')} />
        </View>

        {/* Compte */}
        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: t.colors.border, overflow: 'hidden' }}>
          <MenuRow icon="refresh" tint={t.colors.cyan} label={tr('profile.restore')} onPress={onRestore} />
          <Divider />
          <MenuRow icon="log-out" tint={t.colors.textSecondary} label={tr('profile.logout')} onPress={onLogout} />
          <Divider />
          <MenuRow icon="trash" tint={t.colors.danger} label={tr('profile.deleteAccount')} onPress={onDelete} disabled={busy} danger />
        </View>
        <Text variant="caption" color="textMuted" style={{ textAlign: 'center' }}>{tr('profile.rgpd')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const RANK_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'] as const;
const RANK_EMOJI: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '🔷', elite: '👑',
};
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Carte « Mon personnage » : meilleur rang atteint + nombre d'exercices classés. */
function CharacterCard() {
  const t = useTheme();
  const tr = useT();
  const { data } = useQuery({ queryKey: ['myEntries'], queryFn: fetchMyEntries });
  const ranked = (data ?? []).filter((e) => e.rankSlug)
    .sort((a, b) => RANK_ORDER.indexOf(b.rankSlug as typeof RANK_ORDER[number]) - RANK_ORDER.indexOf(a.rankSlug as typeof RANK_ORDER[number]));
  const best = ranked[0] ?? null;
  const color = best ? t.colors.rank[best.rankSlug as keyof typeof t.colors.rank] : t.colors.textMuted;

  return (
    <Pressable onPress={() => router.push('/my-ranks')} style={{ borderRadius: 20, overflow: 'hidden' }}>
      <LinearGradient colors={[color + '40', t.colors.bgCard]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ padding: t.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: t.spacing.md,
          borderWidth: 1, borderColor: color + '55', borderRadius: 20 }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: color + '2A', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>{best ? (RANK_EMOJI[best.rankSlug!] ?? '🏆') : '🎯'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="overline" color="textMuted">{tr('ranks.card')}</Text>
          {best ? (
            <>
              <Text style={{ fontSize: 20, fontWeight: '900', color, letterSpacing: -0.3 }}>{capitalize(best.rankSlug!)}</Text>
              <Text variant="caption" color="textSecondary">{tr('ranks.rankedCount', { n: ranked.length })}</Text>
            </>
          ) : (
            <>
              <Text variant="h3">{tr('ranks.none')}</Text>
              <Text variant="caption" color="textSecondary">{tr('ranks.see')}</Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.colors.textMuted} />
      </LinearGradient>
    </Pressable>
  );
}

function MenuRow({ icon, tint, label, onPress, disabled, danger }: {
  icon: keyof typeof Ionicons.glyphMap; tint: string; label: string; onPress: () => void; disabled?: boolean; danger?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: tint + '22' }}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={{ flex: 1, fontWeight: '600', color: danger ? t.colors.danger : t.colors.text }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={t.colors.textMuted} />
    </Pressable>
  );
}

function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.colors.border, marginLeft: 60 }} />;
}

function LangButton({ flag, label, active, onPress }: { flag: string; label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: t.spacing.md, borderRadius: t.radius.md,
      backgroundColor: active ? t.colors.primary + '22' : t.colors.bgInput,
      borderWidth: 1, borderColor: active ? t.colors.primary : t.colors.border }}>
      <Text style={{ fontSize: 18 }}>{flag}</Text>
      <Text variant="bodyMedium" style={{ color: active ? t.colors.primary : t.colors.text }}>{label}</Text>
    </Pressable>
  );
}
