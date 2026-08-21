import React from 'react';
import { Pressable } from 'react-native';
import { router, Link } from 'expo-router';
import { AuthForm } from '../../src/features/auth/AuthForm';
import { Text } from '../../src/components';
import { signInWithEmail } from '../../src/services/auth';

export default function SignIn() {
  return (
    <AuthForm
      title="Connexion"
      submitLabel="Se connecter"
      fields={[
        { key: 'email', label: 'Email' },
        { key: 'password', label: 'Mot de passe', secure: true },
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
            <Text color="textSecondary">Pas de compte ? <Text color="primary">Créer un compte</Text></Text>
          </Pressable>
        </Link>
      }
    />
  );
}
