import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme } from '../../src/theme/theme';
import { useT } from '../../src/i18n/useT';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Icône d'onglet : version pleine si actif, contour sinon. */
function tabIcon(base: IoniconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={(focused ? base : `${base}-outline`) as IoniconName} size={23} color={color} />
  );
}

/** Navigation principale : Home, Workout, Progress, Ranking, Profile. */
export default function TabsLayout() {
  const t = useT();
  const c = darkTheme.colors;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', marginTop: -2 },
        tabBarStyle: {
          backgroundColor: c.bgElevated,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 8,
          paddingBottom: 28,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tab.home'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="workout" options={{ title: t('tab.workout'), tabBarIcon: tabIcon('barbell') }} />
      <Tabs.Screen name="progress" options={{ title: t('tab.progress'), tabBarIcon: tabIcon('trending-up') }} />
      <Tabs.Screen name="ranking" options={{ title: t('tab.ranking'), tabBarIcon: tabIcon('podium') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile'), tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
