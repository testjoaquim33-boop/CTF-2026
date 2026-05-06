'use client';

import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Category, Expense } from '@/lib/types';
import { formatAmount } from '@/lib/budgetLogic';

interface Props {
  expenses: Expense[];
  categories: Category[];
  currencySymbol: string;
  onRemove: (id: string) => void;
}

export default function ExpenseList({ expenses, categories, currencySymbol, onRemove }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState(true);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filtered = filter === 'all'
    ? expenses
    : expenses.filter((e) => e.categoryId === filter);

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"
        >
          Dépenses ({expenses.length})
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Category filter */}
        <select
          className="input w-auto text-xs py-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {expanded && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">Aucune dépense enregistrée.</p>
          ) : (
            filtered.map((exp) => {
              const cat = catMap[exp.categoryId];
              return (
                <div
                  key={exp.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 group transition-colors"
                >
                  {/* Category dot */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: (cat?.color ?? '#64748b') + '22' }}
                  >
                    {cat?.icon ?? '💼'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{exp.description}</p>
                    <p className="text-xs text-slate-400">
                      {cat?.name ?? 'Inconnu'} · {new Date(exp.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                    {formatAmount(exp.amount, currencySymbol)}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => onRemove(exp.id)}
                    className="btn-danger p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
