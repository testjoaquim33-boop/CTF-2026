import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button } from '../../components';

interface Field { key: string; label: string; secure?: boolean; }

export function AuthForm({
  title, submitLabel, fields, onSubmit, footer,
}: {
  title: string;
  submitLabel: string;
  fields: Field[];
  onSubmit: (values: Record<string, string>) => Promise<string | null>; // error code or null
  footer?: React.ReactNode;
}) {
  const t = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const err = await onSubmit(values);
    setLoading(false);
    if (err) Alert.alert('Oups', err);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: t.spacing.xl, gap: t.spacing.md }}>
        <Text variant="h1" style={{ marginBottom: t.spacing.md }}>{title}</Text>
        {fields.map((f) => (
          <TextInput
            key={f.key}
            placeholder={f.label}
            placeholderTextColor={t.colors.textMuted}
            secureTextEntry={f.secure}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={f.secure ? 'default' : 'email-address'}
            onChangeText={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
            style={{
              backgroundColor: t.colors.bgInput, color: t.colors.text,
              borderRadius: t.radius.md, padding: t.spacing.lg, fontSize: 16,
            }}
          />
        ))}
        <Button label={loading ? '…' : submitLabel} onPress={submit} disabled={loading} style={{ marginTop: t.spacing.md }} />
        {footer}
      </View>
    </SafeAreaView>
  );
}
