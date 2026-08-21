import { useQuery } from '@tanstack/react-query';
import { fetchPremiumStatus } from '../services/subscription';

/** Hook de gating Premium (statut serveur). */
export function usePremium() {
  const q = useQuery({ queryKey: ['premium'], queryFn: fetchPremiumStatus, staleTime: 60_000 });
  return { isPremium: q.data?.isPremium ?? false, status: q.data?.status ?? 'none', loading: q.isLoading, refetch: q.refetch };
}
