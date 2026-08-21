import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { darkTheme } from '../src/theme/theme';

/**
 * Point d'entrée. Redirige selon la session.
 * NB: les écrans d'auth (login/signup) arrivent à l'étape suivante ; en
 * attendant, sans session on envoie vers l'onboarding pour pouvoir tester le flux.
 */
export default function Index() {
  const { session, initializing } = useAuthStore();
  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: darkTheme.colors.bg }}>
        <ActivityIndicator color={darkTheme.colors.primary} />
      </View>
    );
  }
  return session ? <Redirect href="/(tabs)" /> : <Redirect href="/(onboarding)" />;
}
