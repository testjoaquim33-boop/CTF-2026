/**
 * Notifications (expo-notifications). Enregistre le token push (table push_tokens)
 * et programme des rappels locaux (séance, streak). Configurables par l'utilisateur.
 * Import dynamique pour rester no-op si le module n'est pas dispo (ex. web).
 */
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function registerPushToken(): Promise<{ ok: boolean; error?: string }> {
  try {
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return { ok: false, error: 'permission_denied' };

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { ok: false, error: 'not_authenticated' };

    await supabase.from('push_tokens').upsert(
      { user_id: userId, expo_token: tokenData.data, platform: Platform.OS },
      { onConflict: 'user_id,expo_token' },
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'error' };
  }
}

/** Rappel de séance quotidien à une heure donnée (notification locale récurrente). */
export async function scheduleWorkoutReminder(hour = 18, minute = 0): Promise<void> {
  const Notifications = await import('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: '💪 Prêt pour ta séance ?', body: 'Garde ton streak vivant.' },
    trigger: { hour, minute, repeats: true } as unknown as import('expo-notifications').NotificationTriggerInput,
  });
}

export async function cancelReminders(): Promise<void> {
  const Notifications = await import('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}
