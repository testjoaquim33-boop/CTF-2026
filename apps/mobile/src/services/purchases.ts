/**
 * Wrapper RevenueCat. Activé uniquement si les clés SDK publiques sont présentes.
 * NE JAMAIS mettre de secret ici (les clés SDK RevenueCat sont publiques par design).
 * La vérité du statut Premium reste côté serveur (webhook -> table subscriptions).
 *
 * Nécessite `react-native-purchases` + un dev build EAS (pas Expo Go).
 * Voir docs/MONETIZATION.md.
 */
import { Platform } from 'react-native';
import { config } from './config';

let configured = false;

export function purchasesEnabled(): boolean {
  const key = Platform.OS === 'ios' ? config.revenueCat.iosKey : config.revenueCat.androidKey;
  return key.length > 0;
}

/** Initialise RevenueCat avec l'appUserID = id Supabase (import dynamique). */
export async function initPurchases(supabaseUserId: string): Promise<void> {
  if (!purchasesEnabled() || configured) return;
  const Purchases = (await import('react-native-purchases')).default;
  const apiKey = Platform.OS === 'ios' ? config.revenueCat.iosKey : config.revenueCat.androidKey;
  Purchases.configure({ apiKey, appUserID: supabaseUserId });
  configured = true;
}

export async function getOfferingPackages() {
  const Purchases = (await import('react-native-purchases')).default;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

/** Achat d'un package. Le statut Premium est ensuite confirmé par le webhook serveur. */
export async function purchase(pkg: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const Purchases = (await import('react-native-purchases')).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Purchases.purchasePackage(pkg as any);
    return { ok: true };
  } catch (e) {
    const err = e as { userCancelled?: boolean; message?: string };
    return { ok: false, error: err.userCancelled ? 'cancelled' : err.message ?? 'error' };
  }
}

export async function restorePurchases(): Promise<{ ok: boolean; error?: string }> {
  try {
    const Purchases = (await import('react-native-purchases')).default;
    await Purchases.restorePurchases();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { message?: string }).message ?? 'error' };
  }
}
