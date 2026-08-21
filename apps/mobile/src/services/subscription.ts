import { supabase } from './supabase';

export interface PremiumStatus {
  isPremium: boolean;
  status: string;
  currentPeriodEnd: string | null;
  willRenew: boolean;
}

const PREMIUM_STATES = ['active', 'trial', 'grace'];

/** Statut Premium déterminé côté serveur (table subscriptions, alimentée par webhook). */
export async function fetchPremiumStatus(): Promise<PremiumStatus> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { isPremium: false, status: 'none', currentPeriodEnd: null, willRenew: false };

  const { data } = await supabase
    .from('subscriptions')
    .select('status,current_period_end,will_renew')
    .eq('user_id', userId)
    .maybeSingle();

  const status = data?.status ?? 'none';
  return {
    isPremium: PREMIUM_STATES.includes(status),
    status,
    currentPeriodEnd: data?.current_period_end ?? null,
    willRenew: data?.will_renew ?? false,
  };
}
