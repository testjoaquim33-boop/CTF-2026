import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text } from '../../src/components';
import { StepScaffold } from '../../src/features/onboarding/StepScaffold';
import { useOnboardingStore } from '../../src/store/onboarding';
import { validateStep } from '@project_fit/shared';
import { saveOnboarding } from '../../src/services/onboarding';

function NumberField({ label, value, onChange, suffix }: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: t.spacing.lg }}>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: t.spacing.xs }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.bgInput,
        borderRadius: t.radius.md, paddingHorizontal: t.spacing.lg }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholderTextColor={t.colors.textMuted}
          style={{ flex: 1, color: t.colors.text, paddingVertical: t.spacing.lg, fontSize: 16 }}
        />
        {suffix ? <Text color="textMuted">{suffix}</Text> : null}
      </View>
    </View>
  );
}

export default function BodyStep() {
  const { draft, set } = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [height, setHeight] = useState(draft.heightCm?.toString() ?? '');
  const [weight, setWeight] = useState(draft.weightKg?.toString() ?? '');
  const [target, setTarget] = useState(draft.targetWeightKg?.toString() ?? '');

  const onFinish = async () => {
    const patch = {
      heightCm: parseFloat(height) || undefined,
      weightKg: parseFloat(weight) || undefined,
      targetWeightKg: target ? parseFloat(target) : undefined,
    };
    set(patch);
    const merged = { ...draft, ...patch };
    const err = validateStep('body', merged);
    if (err) { Alert.alert('Vérifie tes informations', err); return; }

    setSaving(true);
    const res = await saveOnboarding(merged);
    setSaving(false);
    if (!res.ok) {
      if (res.error === 'not_authenticated') {
        Alert.alert('Connecte-toi', 'Crée un compte ou connecte-toi pour enregistrer ton profil.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]);
        return;
      }
      Alert.alert('Erreur', res.error ?? 'unknown'); return;
    }
    router.replace('/(tabs)');
  };

  const valid = !!(parseFloat(height) && parseFloat(weight));

  return (
    <StepScaffold
      step="body"
      title="Tes informations"
      subtitle="Utilisées pour personnaliser ton programme et calculer ta force relative"
      canContinue={valid && !saving}
      nextLabel={saving ? 'Enregistrement…' : 'Terminer'}
      onNext={onFinish}
    >
      <NumberField label="Taille" value={height} onChange={setHeight} suffix="cm" />
      <NumberField label="Poids actuel" value={weight} onChange={setWeight} suffix="kg" />
      <NumberField label="Poids objectif (optionnel)" value={target} onChange={setTarget} suffix="kg" />
    </StepScaffold>
  );
}
