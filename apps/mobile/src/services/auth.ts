import { supabase } from './supabase';
import { validateEmail, validatePassword, passwordsMatch } from '@project_fit/shared';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

/** Inscription email/password. Déclenche l'email de vérification (config Supabase). */
export async function signUpWithEmail(
  email: string,
  password: string,
  confirm: string,
  displayName?: string,
): Promise<AuthResult> {
  const e = validateEmail(email);
  if (!e.valid) return { ok: false, error: e.error };
  const p = validatePassword(password);
  if (!p.valid) return { ok: false, error: p.error };
  const m = passwordsMatch(password, confirm);
  if (!m.valid) return { ok: false, error: m.error };

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: displayName ? { display_name: displayName } : undefined },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Connexion email/password. */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const e = validateEmail(email);
  if (!e.valid) return { ok: false, error: e.error };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Envoi d'un email de réinitialisation de mot de passe. */
export async function requestPasswordReset(email: string, redirectTo?: string): Promise<AuthResult> {
  const e = validateEmail(email);
  if (!e.valid) return { ok: false, error: e.error };
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Déconnexion (efface la session locale sécurisée). */
export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Suppression de compte RGPD.
 * On NE supprime PAS depuis le client (aucun droit admin). On appelle une Edge
 * Function sécurisée (service_role) qui supprime/anonymise en cascade puis
 * révoque l'utilisateur. Ensuite on déconnecte localement.
 */
export async function deleteAccount(): Promise<AuthResult> {
  const { error } = await supabase.functions.invoke('account-delete', { method: 'POST' });
  if (error) return { ok: false, error: error.message };
  await supabase.auth.signOut();
  return { ok: true };
}

// --- OAuth natif (Apple / Google) : câblé, activation après config stores ---
// Ces flux nécessitent une configuration Apple Developer / Google Cloud et des
// libs natives (expo-apple-authentication, @react-native-google-signin). Voir
// docs/SETUP_SUPABASE.md. On expose l'API ; l'implémentation native est ajoutée
// quand les identifiants OAuth sont fournis.
export const OAUTH_ENABLED = {
  apple: false,
  google: false,
} as const;
