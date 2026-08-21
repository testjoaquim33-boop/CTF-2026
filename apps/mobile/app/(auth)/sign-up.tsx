import React from 'react';
import { Pressable, Alert } from 'react-native';
import { router, Link } from 'expo-router';
import { AuthForm } from '../../src/features/auth/AuthForm';
import { Text } from '../../src/components';
import { signUpWithEmail } from '../../src/services/auth';

export default function SignUp() {
  return (
    <AuthForm
      title="Créer un compte"
      submitLabel="S'inscrire"
      fields={[
        { key: 'email', label: 'Email' },
        { key: 'password', label: 'Mot de passe (8+ car., 1 lettre + 1 chiffre)', secure: true },
        { key: 'confirm', label: 'Confirmer le mot de passe', secure: true },
      ]}
      onSubmit={async (v) => {
        const res = await signUpWithEmail(v.email ?? '', v.password ?? '', v.confirm ?? '');
        if (!res.ok) return res.error ?? 'error';
        if (res.hasSession) {
          // Session active -> on peut faire l'onboarding tout de suite.
          router.replace('/(onboarding)');
        } else {
          // Confirmation d'email requise : pas de session encore.
          Alert.alert(
            'Vérifie ton email',
            "Nous t'avons envoyé un lien de confirmation. Confirme ton adresse puis connecte-toi.",
            [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }],
          );
        }
        return null;
      }}
      footer={
        <Link href="/(auth)/sign-in" asChild>
          <Pressable style={{ marginTop: 16, alignItems: 'center' }}>
            <Text color="textSecondary">Déjà un compte ? <Text color="primary">Se connecter</Text></Text>
          </Pressable>
        </Link>
      }
    />
  );
}
