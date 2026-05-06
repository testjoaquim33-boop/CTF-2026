'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CATEGORY_ICONS } from '@/lib/types';

interface Props {
  totalBudget: number;
  currencySymbol: string;
  onAdd: (name: string, icon: string, amount: number) => void;
}

const ICON_LIST = Object.entries(CATEGORY_ICONS);

export default function AddCategoryForm({ totalBudget, currencySymbol, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [amount, setAmount] = useState(String(Math.round(totalBudget * 0.1)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    onAdd(name.trim(), icon, amt);
    setName('');
    setAmount(String(Math.round(totalBudget * 0.1)));
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="card border-dashed border-2 flex flex-col items-center justify-center gap-2
                   text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-colors cursor-pointer min-h-[140px]"
      >
        <Plus size={24} />
        <span className="text-sm font-medium">Ajouter une catégorie</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card animate-slide-in space-y-3">
      <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Nouvelle catégorie</p>

      <div>
        <label className="label">Nom</label>
        <input
          autoFocus
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Visites, Plage…"
          list="category-suggestions"
        />
        <datalist id="category-suggestions">
          {ICON_LIST.map(([n]) => <option key={n} value={n} />)}
        </datalist>
      </div>

      <div>
        <label className="label">Icône</label>
        <div className="flex flex-wrap gap-2">
          {ICON_LIST.map(([, emoji]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`text-xl p-1.5 rounded-lg border-2 transition-colors
                ${icon === emoji ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent hover:border-slate-300'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Budget ({currencySymbol})</label>
        <input
          type="number"
          min={1}
          step={10}
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-slate-400 mt-1">
          Ce montant sera prélevé proportionnellement sur les autres catégories.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(false)}>
          Annuler
        </button>
        <button type="submit" className="btn-primary text-sm">
          Ajouter
        </button>
      </div>
    </form>
  );
}
