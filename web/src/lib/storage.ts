import { BudgetState } from './types';

const STORAGE_KEY = 'vacation_budget_v1';

const DEFAULT_STATE: BudgetState = {
  name: 'Mes vacances d\'été',
  totalAmount: 3000,
  currency: 'EUR',
  startDate: '',
  endDate: '',
  categories: [
    { id: 'cat-1', name: 'Logement',   icon: '🏨', budgetAmount: 900,  color: '#3b82f6' },
    { id: 'cat-2', name: 'Transport',  icon: '✈️', budgetAmount: 600,  color: '#10b981' },
    { id: 'cat-3', name: 'Nourriture', icon: '🍽️', budgetAmount: 750,  color: '#f59e0b' },
    { id: 'cat-4', name: 'Loisirs',    icon: '🎭', budgetAmount: 450,  color: '#ef4444' },
    { id: 'cat-5', name: 'Shopping',   icon: '🛍️', budgetAmount: 300,  color: '#8b5cf6' },
  ],
  expenses: [],
};

export function loadState(): BudgetState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as BudgetState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: BudgetState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn('Impossible de sauvegarder dans localStorage');
  }
}

export function exportStateAsJSON(state: BudgetState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budget-vacances-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportStateAsCSV(state: BudgetState): void {
  const lines = [
    ['Date', 'Catégorie', 'Description', 'Montant'].join(','),
    ...state.expenses.map((e) => {
      const cat = state.categories.find((c) => c.id === e.categoryId);
      return [e.date, cat?.name ?? 'Inconnu', `"${e.description}"`, e.amount].join(',');
    }),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `depenses-vacances-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
