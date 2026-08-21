/**
 * Analytics — wrapper sûr. Envoie à PostHog si la clé publique est présente,
 * sinon no-op (aucun crash, aucun envoi). Aucune donnée sensible ne doit être
 * envoyée en propriété d'événement.
 */
import { config } from './config';

export const EVENTS = {
  onboardingStarted: 'onboarding_started',
  onboardingCompleted: 'onboarding_completed',
  workoutStarted: 'workout_started',
  workoutCompleted: 'workout_completed',
  exerciseCompleted: 'exercise_completed',
  personalRecord: 'personal_record',
  aiUsed: 'ai_used',
  paywallViewed: 'paywall_viewed',
  subscriptionStarted: 'subscription_started',
  subscriptionCancelled: 'subscription_cancelled',
  shareGymCard: 'share_gym_card',
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

let client: { capture: (e: string, p?: Record<string, unknown>) => void } | null = null;
let ready = false;

export async function initAnalytics(): Promise<void> {
  if (ready || !config.posthog.key) return;
  try {
    const mod = await import('posthog-react-native' as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PostHog: any = (mod as any).default ?? mod;
    client = new PostHog(config.posthog.key, { host: config.posthog.host });
    ready = true;
  } catch {
    client = null; // dépendance absente -> no-op
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!client) return;
  try { client.capture(event, props); } catch { /* no-op */ }
}
