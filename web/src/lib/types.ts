export interface Category {
  id: string;
  name: string;
  icon: string;
  budgetAmount: number;
  color: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string; // ISO string
}

export interface BudgetState {
  name: string;
  totalAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  categories: Category[];
  expenses: Expense[];
}

export interface CategoryStats extends Category {
  spent: number;
  remaining: number;
  percentage: number; // spent / budgetAmount
}

export const CATEGORY_ICONS: Record<string, string> = {
  Logement:    '🏨',
  Transport:   '✈️',
  Nourriture:  '🍽️',
  Loisirs:     '🎭',
  Shopping:    '🛍️',
  Santé:       '💊',
  Visites:     '🗺️',
  Plage:       '🏖️',
  Autres:      '💼',
};

export const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#6366f1', // indigo
];

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar US' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse' },
  { code: 'JPY', symbol: '¥', label: 'Yen Japonais' },
  { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien' },
];
