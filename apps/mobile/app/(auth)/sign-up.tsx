import React from 'react';
import { Pressable, Alert } from 'react-native';
import { router, Link } from 'expo-router';
import { AuthForm } from '../../src/features/auth/AuthForm';
import { Text } from '../../src/components';
import { signUpWithEmail } from '../../src/services/auth';
import { useT } from '../../src/i18n/useT';

export default function SignUp() {
  const tr = useT();
  return (
    <AuthForm
      title={tr('auth.signUpTitle')}
      submitLabel={tr('auth.signUpSubmit')}
      fields={[
        { key: 'email', label: tr('auth.email') },
        { key: 'password', label: tr('auth.passwordRule'), secure: true },
        { key: 'confirm', label: tr('auth.confirmPassword'), secure: true },
      ]}
      onSubmit={async (v) => {
        const res = await signUpWithEmail(v.email ?? '', v.password ?? '', v.confirm ?? '');
        if (!res.ok) return res.error ?? 'error';
        if (res.hasSession) {
          router.replace('/(onboarding)');
        } else {
          Alert.alert(
            tr('auth.checkEmailTitle'),
            tr('auth.checkEmailMsg'),
            [{ text: tr('common.ok'), onPress: () => router.replace('/(auth)/sign-in') }],
          );
        }
        return null;
      }}
      footer={
        <Link href="/(auth)/sign-in" asChild>
          <Pressable style={{ marginTop: 16, alignItems: 'center' }}>
            <Text color="textSecondary">{tr('auth.haveAccount')} <Text color="primary">{tr('auth.signInSubmit')}</Text></Text>
          </Pressable>
        </Link>
      }
    />
  );
}
