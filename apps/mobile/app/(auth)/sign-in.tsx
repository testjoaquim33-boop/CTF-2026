import React from 'react';
import { Pressable } from 'react-native';
import { router, Link } from 'expo-router';
import { AuthForm } from '../../src/features/auth/AuthForm';
import { Text } from '../../src/components';
import { signInWithEmail } from '../../src/services/auth';
import { useT } from '../../src/i18n/useT';

export default function SignIn() {
  const tr = useT();
  return (
    <AuthForm
      title={tr('auth.signInTitle')}
      submitLabel={tr('auth.signInSubmit')}
      fields={[
        { key: 'email', label: tr('auth.email') },
        { key: 'password', label: tr('auth.password'), secure: true },
      ]}
      onSubmit={async (v) => {
        const res = await signInWithEmail(v.email ?? '', v.password ?? '');
        if (!res.ok) return res.error ?? 'error';
        router.replace('/(tabs)');
        return null;
      }}
      footer={
        <Link href="/(auth)/sign-up" asChild>
          <Pressable style={{ marginTop: 16, alignItems: 'center' }}>
            <Text color="textSecondary">{tr('auth.noAccount')} <Text color="primary">{tr('auth.createAccount')}</Text></Text>
          </Pressable>
        </Link>
      }
    />
  );
}
