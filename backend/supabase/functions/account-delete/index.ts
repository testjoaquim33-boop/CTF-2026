// ============================================================================
// Edge Function : account-delete (RGPD)
// Supprime/anonymise réellement les données de l'utilisateur AUTHENTIFIÉ puis
// supprime son compte auth. Utilise le service_role (jamais exposé au client).
//
// Sécurité :
//  - L'utilisateur est identifié par SON JWT (header Authorization), pas par un
//    id envoyé dans le body -> impossible de supprimer le compte d'autrui.
//  - Le service_role bypass RLS : on cible strictement user.id.
//
// Déploiement : `supabase functions deploy account-delete`
// Secret requis : SUPABASE_SERVICE_ROLE_KEY (auto-fourni par la plateforme),
//                 SUPABASE_URL (auto).
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1) Identifier l'utilisateur à partir de SON token (pas d'id dans le body).
  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);
  const userId = userData.user.id;

  // 2) Client admin (service_role) pour les opérations privilégiées.
  const admin = createClient(supabaseUrl, serviceKey);

  // 3) Anonymiser les traces publiques qui doivent survivre agrégées
  //    (leaderboard : on retire l'identité mais on peut garder l'entrée si
  //    souhaité ; ici on supprime pour une suppression complète).
  //    Les tables user-owned sont supprimées par CASCADE via auth.users delete,
  //    mais on nettoie explicitement les données publiques d'abord.
  await admin.from('leaderboard_entries').delete().eq('user_id', userId);

  // 4) Supprimer le compte auth -> déclenche ON DELETE CASCADE sur toutes les
  //    tables référençant auth.users(id) (profiles, workouts, sets via cascade,
  //    subscriptions, notifications, etc.).
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return json({ error: 'delete_failed', detail: delErr.message }, 500);

  return json({ ok: true }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
