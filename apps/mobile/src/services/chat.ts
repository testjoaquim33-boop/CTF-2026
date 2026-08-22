import { supabase } from './supabase';
import { trimChatHistory, type ChatMessage } from '@project_fit/shared';

export interface ChatResult {
  ok: boolean;
  reply?: string;
  safety?: boolean;
  error?: string;
}

/**
 * Envoie l'historique de conversation au Coach IA (edge function ai-chat).
 * La clé Anthropic reste côté serveur ; l'historique est assaini avant envoi.
 */
export async function sendChatMessage(history: ChatMessage[]): Promise<ChatResult> {
  const messages = trimChatHistory(history);
  const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages } });

  if (error) {
    // Corps d'une réponse non-2xx (quota, ai_not_configured…) dans error.context.
    const resp = (error as { context?: Response }).context;
    if (resp && typeof resp.json === 'function') {
      try {
        const b = (await resp.json()) as { error?: string; reply?: string; safety?: boolean };
        if (b.error) return { ok: false, error: b.error };
      } catch {
        // illisible -> message générique
      }
    }
    return { ok: false, error: error.message };
  }

  const d = data as { reply?: string; safety?: boolean; error?: string };
  if (d.error) return { ok: false, error: d.error };
  return { ok: true, reply: d.reply ?? '', safety: d.safety };
}
