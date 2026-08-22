import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { usePremium } from '../../src/hooks/usePremium';
import { useAuthStore } from '../../src/store/auth';
import { useSettings, type Lang } from '../../src/store/settings';
import { useT } from '../../src/i18n/useT';
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md }}>
        <Text variant="h1">{tr('profile.title')}</Text>
        <Text color="textSecondary">{user?.email ?? '—'}</Text>

        {/* Sélecteur de langue */}
        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.lg,
          borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.sm }}>
          <Text variant="overline" color="textMuted">{tr('profile.language')}</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <LangButton flag="🇫🇷" label="Français" active={lang === 'fr'} onPress={() => setLang('fr')} />
            <LangButton flag="🇬🇧" label="English" active={lang === 'en'} onPress={() => setLang('en')} />
          </View>
        </View>

        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.lg,
          borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.sm }}>
          <Text variant="overline" color="textMuted">{tr('profile.displayName')}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={tr('profile.namePlaceholder')} placeholderTextColor={t.colors.textMuted}
            style={{ backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.md, padding: t.spacing.md, fontSize: 16 }} />
          <Button label={savingName ? '…' : tr('profile.saveName')} onPress={saveName} disabled={savingName} />
        </View>

        <View style={{ backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md, padding: t.spacing.lg,
          borderWidth: 1, borderColor: isPremium ? t.colors.primary : t.colors.border, gap: t.spacing.xs }}>
          <Text variant="overline" color="textMuted">{tr('profile.subscription')}</Text>
          <Text variant="h3" color={isPremium ? 'primary' : 'text'}>
            {isPremium ? tr('profile.premium') : tr('profile.free')}
          </Text>
          <Text variant="caption" color="textSecondary">{tr('profile.status', { status })}</Text>
        </View>

        <Button label={tr('profile.coachChat')} onPress={() => router.push('/coach/chat')} />
        <Button label={tr('profile.badges')} variant="secondary" onPress={() => router.push('/achievements')} />
        <Button label={tr('profile.challenges')} variant="secondary" onPress={() => router.push('/challenges')} />

        {!isPremium ? (
          <Button label={tr('profile.goPremium')} onPress={() => router.push('/paywall')} />
        ) : null}
        <Button label={tr('profile.restore')} variant="secondary" onPress={onRestore} />
        <Button label={tr('profile.logout')} variant="secondary" onPress={onLogout} />

        <View style={{ height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.md }} />
        <Button label={busy ? '…' : tr('profile.deleteAccount')} variant="secondary" onPress={onDelete} disabled={busy} />
        <Text variant="caption" color="textMuted">{tr('profile.rgpd')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
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
