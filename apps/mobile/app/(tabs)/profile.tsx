import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { usePremium } from '../../src/hooks/usePremium';
import { useAuthStore } from '../../src/store/auth';
import { signOut, deleteAccount } from '../../src/services/auth';
import { supabase } from '../../src/services/supabase';
import { restorePurchases, purchasesEnabled } from '../../src/services/purchases';

export default function ProfileScreen() {
  const t = useTheme();
  const { isPremium, status } = usePremium();
  const user = useAuthStore((s) => s.user);
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
    Alert.alert(error ? 'Erreur' : 'Enregistré', error ? error.message : 'Ton nom a été mis à jour.');
  };

  const onLogout = async () => { await signOut(); router.replace('/(auth)/sign-in'); };

  const onDelete = () => {
    Alert.alert('Supprimer le compte', 'Cette action est irréversible. Toutes tes données seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        setBusy(true);
        const res = await deleteAccount();
        setBusy(false);
        if (!res.ok) { Alert.alert('Erreur', res.error ?? 'unknown'); return; }
        router.replace('/(auth)/sign-in');
      } },
    ]);
  };

  const onRestore = async () => {
    if (!purchasesEnabled()) { Alert.alert('Bientôt', 'RevenueCat pas encore configuré.'); return; }
    const res = await restorePurchases();
    Alert.alert(res.ok ? 'Restauré' : 'Erreur', res.ok ? 'Achats restaurés.' : res.error ?? '');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md }}>
        <Text variant="h1">Profil</Text>
        <Text color="textSecondary">{user?.email ?? '—'}</Text>

        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.lg,
          borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.sm }}>
          <Text variant="overline" color="textMuted">NOM AFFICHÉ</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Ton prénom" placeholderTextColor={t.colors.textMuted}
            style={{ backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.md, padding: t.spacing.md, fontSize: 16 }} />
          <Button label={savingName ? '…' : 'Enregistrer le nom'} onPress={saveName} disabled={savingName} />
        </View>

        <View style={{ backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md, padding: t.spacing.lg,
          borderWidth: 1, borderColor: isPremium ? t.colors.primary : t.colors.border, gap: t.spacing.xs }}>
          <Text variant="overline" color="textMuted">ABONNEMENT</Text>
          <Text variant="h3" color={isPremium ? 'primary' : 'text'}>
            {isPremium ? '⭐ Premium' : 'Gratuit'}
          </Text>
          <Text variant="caption" color="textSecondary">Statut : {status}</Text>
        </View>

        <Button label="✨  Coach IA (chat)" onPress={() => router.push('/coach/chat')} />
        <Button label="🏅  Mes badges" variant="secondary" onPress={() => router.push('/achievements')} />
        <Button label="🔥  Défis" variant="secondary" onPress={() => router.push('/challenges')} />

        {!isPremium ? (
          <Button label="Passer Premium" onPress={() => router.push('/paywall')} />
        ) : null}
        <Button label="Restaurer mes achats" variant="secondary" onPress={onRestore} />
        <Button label="Se déconnecter" variant="secondary" onPress={onLogout} />

        <View style={{ height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.md }} />
        <Button label={busy ? '…' : 'Supprimer mon compte'} variant="secondary" onPress={onDelete} disabled={busy} />
        <Text variant="caption" color="textMuted">
          La suppression efface/anonymise tes données conformément au RGPD.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
