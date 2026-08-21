# PROJECT_FIT — AI Coach

## Architecture (sécurisée)
```
App ──(JWT)──► Edge Function ai-recommendation ──► Anthropic API (clé serveur)
                    │  quota Free/Premium, données lues EN BASE, sortie JSON validée
                    ▼
              Réponse validée ──► App
```

## Points clés
- **Clé API** : `ANTHROPIC_API_KEY` en secret Supabase uniquement. Jamais côté client / Git.
  `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
- **Anti-triche / anti-injection** : les performances sont **lues en base** (table `sets`),
  pas envoyées par le client. Le client ne fournit que `exerciseId` + une note libre.
- **Modèle** : `AI_MODEL` (défaut `claude-haiku-4-5`, économique pour ce cas simple).
  Configurable sans redéploiement de l'app. Modèles plus puissants pour les cas complexes
  (génération de programme) à ajouter en V1.1.
- **Contrôle des coûts** : quotas hebdomadaires par tier (`AI_FREE_WEEKLY_LIMIT` défaut 3,
  `AI_PREMIUM_WEEKLY_LIMIT` défaut 100), logging tokens/coût dans `ai_recommendations`.
- **Sortie** : JSON strict validé ; **fallback déterministe** (progression prudente
  calculée) si l'IA échoue ou renvoie un JSON invalide → jamais d'échec dur.
- **Sécurité produit** : l'IA ne se présente jamais comme médecin et ne diagnostique pas.
  Une note contenant « douleur/blessure/pain… » déclenche un message de prudence
  (« consulte un professionnel de santé ») au lieu d'une recommandation. Disclaimer
  attaché à chaque réponse.

## Déploiement
```bash
supabase functions deploy ai-recommendation
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optionnel :
supabase secrets set AI_MODEL=claude-haiku-4-5 AI_FREE_WEEKLY_LIMIT=3 AI_PREMIUM_WEEKLY_LIMIT=100
```

## Modèles Anthropic (réf.)
IDs actuels : `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5` (utilisé ici),
`claude-fable-5`. Endpoint `POST /v1/messages`, header `anthropic-version: 2023-06-01`.

## À venir (V1.1)
- Génération de programme complet (modèle plus puissant, effort supérieur).
- Adaptation automatique multi-semaines (détection surperformance / difficulté / absence).
- Cache par `input_hash` pour éviter les appels redondants.
