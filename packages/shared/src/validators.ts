/**
 * Validation d'entrées d'authentification — pures & testables.
 * La validation forte reste côté serveur ; ceci améliore l'UX (feedback immédiat).
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// RFC-simplifié : suffisant pour un feedback client. La vérité = email de confirmation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationResult {
  const e = email.trim();
  if (e.length === 0) return { valid: false, error: 'email_required' };
  if (e.length > 254) return { valid: false, error: 'email_too_long' };
  if (!EMAIL_RE.test(e)) return { valid: false, error: 'email_invalid' };
  return { valid: true };
}

/**
 * Politique mot de passe : >= 8 caractères, au moins une lettre et un chiffre.
 * (Aligné avec une politique Supabase Auth raisonnable ; ajustable côté projet.)
 */
export function validatePassword(pw: string): ValidationResult {
  if (pw.length < 8) return { valid: false, error: 'password_too_short' };
  if (pw.length > 72) return { valid: false, error: 'password_too_long' }; // bcrypt limit
  if (!/[A-Za-z]/.test(pw)) return { valid: false, error: 'password_needs_letter' };
  if (!/[0-9]/.test(pw)) return { valid: false, error: 'password_needs_number' };
  return { valid: true };
}

export function passwordsMatch(a: string, b: string): ValidationResult {
  if (a !== b) return { valid: false, error: 'passwords_mismatch' };
  return { valid: true };
}
