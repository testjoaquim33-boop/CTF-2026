import { Category, CategoryStats, Expense } from './types';

/**
 * Recalcule la répartition des catégories quand une catégorie change.
 *
 * Règle : le total des budgets de catégories est toujours égal au budget global.
 * Quand la catégorie A augmente de Δ, les autres diminuent proportionnellement
 * selon leur budget actuel. Aucune catégorie ne peut descendre sous 0.
 */
export function redistributeOnCategoryChange(
  categories: Category[],
  changedId: string,
  newAmount: number,
): Category[] {
  const total = categories.reduce((s, c) => s + c.budgetAmount, 0);

  // Clamp la nouvelle valeur entre 0 et le total global
  const clampedAmount = Math.max(0, Math.min(newAmount, total));

  const others = categories.filter((c) => c.id !== changedId);
  const othersTotal = others.reduce((s, c) => s + c.budgetAmount, 0);
  const remaining = total - clampedAmount;

  return categories.map((cat) => {
    if (cat.id === changedId) return { ...cat, budgetAmount: round2(clampedAmount) };

    if (othersTotal === 0) {
      // Répartition équitable si toutes les autres catégories sont à 0
      return { ...cat, budgetAmount: round2(remaining / others.length) };
    }

    // Répartition proportionnelle
    const proportion = cat.budgetAmount / othersTotal;
    return { ...cat, budgetAmount: round2(remaining * proportion) };
  });
}

/**
 * Ajoute une nouvelle catégorie en prélevant son budget
 * proportionnellement sur les autres catégories.
 */
export function addCategoryWithRedistribution(
  categories: Category[],
  newCategory: Category,
  totalBudget: number,
): Category[] {
  const newAmount = newCategory.budgetAmount;

  if (categories.length === 0) {
    return [{ ...newCategory, budgetAmount: round2(Math.min(newAmount, totalBudget)) }];
  }

  const currentTotal = categories.reduce((s, c) => s + c.budgetAmount, 0);
  const factor = Math.max(0, currentTotal - newAmount) / (currentTotal || 1);

  const updated = categories.map((c) => ({
    ...c,
    budgetAmount: round2(c.budgetAmount * factor),
  }));

  return [...updated, { ...newCategory, budgetAmount: round2(newAmount) }];
}

/**
 * Supprime une catégorie et redistribue son budget aux autres proportionnellement.
 */
export function removeCategoryWithRedistribution(
  categories: Category[],
  removedId: string,
): Category[] {
  const removed = categories.find((c) => c.id === removedId);
  if (!removed) return categories;

  const remaining = categories.filter((c) => c.id !== removedId);
  if (remaining.length === 0) return [];

  const remainTotal = remaining.reduce((s, c) => s + c.budgetAmount, 0);
  const extra = removed.budgetAmount;

  if (remainTotal === 0) {
    const share = round2(extra / remaining.length);
    return remaining.map((c) => ({ ...c, budgetAmount: share }));
  }

  return remaining.map((c) => ({
    ...c,
    budgetAmount: round2(c.budgetAmount + extra * (c.budgetAmount / remainTotal)),
  }));
}

/** Calcule les stats par catégorie à partir des dépenses. */
export function computeCategoryStats(
  categories: Category[],
  expenses: Expense[],
): CategoryStats[] {
  return categories.map((cat) => {
    const spent = expenses
      .filter((e) => e.categoryId === cat.id)
      .reduce((s, e) => s + e.amount, 0);
    const remaining = Math.max(0, cat.budgetAmount - spent);
    const percentage = cat.budgetAmount > 0 ? Math.min(100, (spent / cat.budgetAmount) * 100) : 0;
    return { ...cat, spent: round2(spent), remaining: round2(remaining), percentage: round2(percentage) };
  });
}

/** Dépenses totales */
export function totalSpent(expenses: Expense[]): number {
  return round2(expenses.reduce((s, e) => s + e.amount, 0));
}

/** Formate un montant selon la devise */
export function formatAmount(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Arrondi à 2 décimales */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
