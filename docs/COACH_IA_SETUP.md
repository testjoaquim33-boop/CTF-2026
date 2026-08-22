# Activer le Coach IA

Le Coach IA est **déjà codé** (écran app + edge function sécurisée avec quota,
anti-triche et garde-fou santé). Il reste 2 étapes **côté serveur** pour l'activer.

> Sécurité : la clé Anthropic n'est **jamais** dans l'app ni dans le repo. Elle
> vit uniquement comme secret serveur. L'app appelle l'edge function ; l'edge
> function appelle Anthropic. Les performances sont **lues en base** (source de
> vérité), jamais envoyées par le client → anti-triche / anti-injection.

## 1. Ajouter le secret `ANTHROPIC_API_KEY`

Dashboard Supabase → **Edge Functions** → **Secrets** (ou *Project Settings →
Edge Functions → Secrets*) → ajouter :

| Nom | Valeur |
|-----|--------|
| `ANTHROPIC_API_KEY` | ta clé `sk-ant-...` (console.anthropic.com) |
| `AI_MODEL` *(optionnel)* | `claude-haiku-4-5` (défaut, rapide et économique) |

> Pas besoin d'ajouter `SUPABASE_URL` ni `SUPABASE_SERVICE_ROLE_KEY` : Supabase
> les injecte automatiquement dans les edge functions.

Quotas (optionnels, défauts raisonnables) : `AI_FREE_WEEKLY_LIMIT` (3),
`AI_PREMIUM_WEEKLY_LIMIT` (100).

## 2. Déployer les fonctions

Deux fonctions IA, toutes deux **auto-suffisantes** (aucune dépendance à copier) :

| Fonction | Rôle |
|----------|------|
| `ai-chat` | **Chatbot conversationnel** (sport/nutrition/conseils/programmes). ⭐ principale |
| `ai-recommendation` | Recommandation structurée (charge/séries/reps) sur un exercice. Optionnelle |

### Option A — Dashboard (sans CLI ni Docker) ✅ recommandé pour toi

Pour **chaque** fonction :
1. Dashboard → **Edge Functions** → **Deploy a new function** / **Create function**.
2. Nom exact : `ai-chat` (puis, si tu veux, `ai-recommendation`).
3. Colle tout le contenu de `backend/supabase/functions/<nom>/index.ts`.
4. **Deploy**.

### Option B — CLI (si tu as la CLI Supabase installée)

```bash
supabase functions deploy ai-chat
supabase functions deploy ai-recommendation   # optionnel
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Quotas chat (optionnels) : `AI_CHAT_FREE_WEEKLY_LIMIT` (20), `AI_CHAT_PREMIUM_WEEKLY_LIMIT` (1000).

## 3. Tester dans l'app

**Chatbot** : Accueil → carte **✨ Coach IA** (ou Profil → *Coach IA (chat)*) → pose une question
(« Fais-moi un programme full-body », « Combien de protéines par jour ? »…).

**Recommandation** : fiche d'un exercice → **🤖 Demander à l'AI Coach**.

Comportements :
- Question sport/nutrition → réponse de coach, concise et actionnable.
- Douleur/blessure mentionnée → message de prudence (pas de conseil médical).
- Hors sujet → l'IA recentre poliment sur le sport/la nutrition.
- Sans clé configurée → message clair « Le Coach IA n'est pas encore activé ».
- Quota atteint (gratuit) → invitation à passer Premium.

## Notes

- Modèle configurable sans redéploiement via le secret `AI_MODEL`.
- Fallback déterministe : si l'IA échoue ou renvoie un JSON invalide, l'utilisateur
  reçoit quand même une recommandation cohérente (jamais d'échec dur).
- Les mêmes étapes valent pour les autres edge functions du projet
  (`leaderboard-submit`, `revenuecat-webhook`, `account-delete`) le moment venu.
