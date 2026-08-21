import React from 'react';
import { Tabs } from 'expo-router';
import { darkTheme } from '../../src/theme/theme';

/** Navigation principale : Home, Workout, Progress, Ranking, Profile.
 *  Écrans placeholder pour l'instant — remplis dans les phases suivantes. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: darkTheme.colors.primary,
        tabBarInactiveTintColor: darkTheme.colors.textMuted,
        tabBarStyle: { backgroundColor: darkTheme.colors.bgElevated, borderTopColor: darkTheme.colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="workout" options={{ title: 'Séance' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progrès' }} />
      <Tabs.Screen name="ranking" options={{ title: 'Classement' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
