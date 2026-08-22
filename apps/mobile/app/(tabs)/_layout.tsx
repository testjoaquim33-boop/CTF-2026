import React from 'react';
import { Tabs } from 'expo-router';
import { darkTheme } from '../../src/theme/theme';
import { useT } from '../../src/i18n/useT';

/** Navigation principale : Home, Workout, Progress, Ranking, Profile. */
export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: darkTheme.colors.primary,
        tabBarInactiveTintColor: darkTheme.colors.textMuted,
        tabBarStyle: { backgroundColor: darkTheme.colors.bgElevated, borderTopColor: darkTheme.colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tab.home') }} />
      <Tabs.Screen name="workout" options={{ title: t('tab.workout') }} />
      <Tabs.Screen name="progress" options={{ title: t('tab.progress') }} />
      <Tabs.Screen name="ranking" options={{ title: t('tab.ranking') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile') }} />
    </Tabs>
  );
}
