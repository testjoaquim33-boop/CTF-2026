// ============================================================================
// Chat coach IA — helpers purs (partagés app). Le vrai appel LLM se fait
// côté serveur (edge function ai-chat), clé jamais exposée au client.
//
// Ici : typage des messages + assainissement de l'historique envoyé au serveur
// (borne la taille, retire le vide, garde les N derniers tours). Le serveur
// ré-applique ses propres garde-fous (defense-in-depth).
// ============================================================================

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export const CHAT_MAX_TURNS = 20;         // messages max envoyés (fenêtre glissante)
export const CHAT_MAX_CHARS = 2000;       // taille max d'un message

/**
 * Assainit l'historique avant envoi au serveur :
 *  - ne garde que les rôles valides et le contenu non vide ;
 *  - borne chaque message à `maxChars` ;
 *  - ne conserve que les `maxTurns` derniers messages ;
 *  - garantit que le premier message conservé est 'user' (l'API l'exige).
 */
export function trimChatHistory(
  messages: ChatMessage[],
  maxTurns: number = CHAT_MAX_TURNS,
  maxChars: number = CHAT_MAX_CHARS,
): ChatMessage[] {
  const cleaned = (messages ?? [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, maxChars) }))
    .filter((m) => m.content.length > 0);

  const windowed = cleaned.slice(-Math.max(1, maxTurns));

  // L'API Messages exige que le premier message soit 'user'.
  let start = 0;
  while (start < windowed.length && windowed[start]!.role !== 'user') start++;
  return windowed.slice(start);
}

/** Détection basique de douleur/blessure (garde-fou santé, non médical). */
export function mentionsPainOrInjury(text: string): boolean {
  return /(douleur|bless|mal au|me fait mal|entorse|claqua|déchir|pain|injur|hurts?)/i.test(text ?? '');
}
