'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Category } from '@/lib/types';

interface Props {
  categories: Category[];
  defaultCategoryId?: string;
  currencySymbol: string;
  onAdd: (categoryId: string, description: string, amount: number, date: string) => void;
  onClose: () => void;
}

export default function ExpenseModal({ categories, defaultCategoryId, currencySymbol, onAdd, onClose }: Props) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    descRef.current?.focus();
    // Close on Escape
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!categoryId || isNaN(amt) || amt <= 0) return;
    onAdd(categoryId, description.trim() || 'Dépense', amt, date);
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md mx-4 shadow-xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Nouvelle dépense</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Catégorie</label>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <input
              ref={descRef}
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Hôtel nuit 1, Taxi aéroport…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Montant ({currencySymbol})</label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  );
}
