// ============================================================================
// Edge Function : revenuecat-webhook
// Reçoit les événements RevenueCat et met à jour la table `subscriptions`
// (SOURCE DE VÉRITÉ du statut Premium). Le client ne détermine jamais Premium
// tout seul : il lit ce statut côté serveur (protégé par RLS).
//
// Auth : RevenueCat envoie l'en-tête Authorization que tu configures dans son
// dashboard. On le compare à REVENUECAT_WEBHOOK_SECRET.
//
// Mapping app_user_id -> auth.users.id : configure Purchases avec
// appUserID = <supabase user id> côté app (voir docs/MONETIZATION.md).
//
// Déploiement : supabase functions deploy revenuecat-webhook --no-verify-jwt
//   (--no-verify-jwt car l'appelant est RevenueCat, pas un utilisateur ; on
//    authentifie via le secret partagé ci-dessous.)
// Secret : supabase secrets set REVENUECAT_WEBHOOK_SECRET=...
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const auth = req.headers.get('Authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const event = payload?.event;
  if (!event) return new Response('bad_request', { status: 400 });

  const userId: string | undefined = event.app_user_id;
  if (!userId) return new Response('no_user', { status: 400 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Journalise l'événement brut (audit)
  await admin.from('subscription_events').insert({ user_id: userId, event_type: event.type ?? 'UNKNOWN', payload });

  const status = mapStatus(event.type, event.period_type);
  const willRenew = !['CANCELLATION', 'EXPIRATION'].includes(event.type);
  const store = event.store === 'APP_STORE' ? 'app_store' : event.store === 'PLAY_STORE' ? 'play_store' : null;
  const entitlement = Array.isArray(event.entitlement_ids) ? event.entitlement_ids[0] : event.entitlement_id ?? null;

  await admin.from('subscriptions').upsert({
    user_id: userId,
    status,
    product_id: event.product_id ?? null,
    store,
    entitlement,
    current_period_end: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
    will_renew: willRenew,
    rc_app_user_id: userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

function mapStatus(type: string, periodType?: string): string {
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION':
      return periodType === 'TRIAL' ? 'trial' : 'active';
    case 'CANCELLATION':        // annulé mais actif jusqu'à expiration
      return 'active';
    case 'BILLING_ISSUE':
      return 'grace';
    case 'EXPIRATION':
      return 'expired';
    default:
      return 'active';
  }
}
