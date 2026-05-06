'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { BudgetState, CURRENCIES } from '@/lib/types';
import { formatAmount } from '@/lib/budgetLogic';

interface Props {
  state: BudgetState;
  onSetTotal: (n: number) => void;
  onSetMeta: (meta: Partial<Pick<BudgetState, 'name' | 'currency' | 'startDate' | 'endDate'>>) => void;
}

export default function BudgetSetup({ state, onSetTotal, onSetMeta }: Props) {
  const [open, setOpen] = useState(false);
  const [localTotal, setLocalTotal] = useState(String(state.totalAmount));
  const [simAmount, setSimAmount] = useState('');

  const currency = CURRENCIES.find((c) => c.code === state.currency) ?? CURRENCIES[0];

  const handleTotalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(localTotal);
    if (!isNaN(val) && val > 0) onSetTotal(val);
    setOpen(false);
  };

  const simDiff = simAmount ? parseFloat(simAmount) - state.totalAmount : null;

  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between">
        {/* Left — totals */}
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Budget total</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatAmount(state.totalAmount, currency.symbol)}
          </p>
          {state.startDate && state.endDate && (
            <p className="text-xs text-slate-400 mt-1">
              {new Date(state.startDate).toLocaleDateString('fr-FR')} →{' '}
              {new Date(state.endDate).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>

        {/* Right — edit button */}
        <button onClick={() => setOpen((o) => !o)} className="btn-ghost flex items-center gap-1.5 text-sm">
          <Settings2 size={16} />
          Modifier
        </button>
      </div>

      {/* Expanded form */}
      {open && (
        <form
          onSubmit={handleTotalSubmit}
          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid gap-4 sm:grid-cols-2 animate-slide-in"
        >
          <div>
            <label className="label">Nom du voyage</label>
            <input
              className="input"
              value={state.name}
              onChange={(e) => onSetMeta({ name: e.target.value })}
              placeholder="Ex : Vacances Grèce 2025"
            />
          </div>

          <div>
            <label className="label">Devise</label>
            <select
              className="input"
              value={state.currency}
              onChange={(e) => onSetMeta({ currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} — {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date de départ</label>
            <input
              type="date"
              className="input"
              value={state.startDate}
              onChange={(e) => onSetMeta({ startDate: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Date de retour</label>
            <input
              type="date"
              className="input"
              value={state.endDate}
              onChange={(e) => onSetMeta({ endDate: e.target.value })}
            />
          </div>

          {/* Budget total + simulation */}
          <div className="sm:col-span-2 border-t pt-4 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Budget &amp; Simulation
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Budget total ({currency.symbol})</label>
                <input
                  type="number"
                  min={1}
                  step={10}
                  className="input"
                  value={localTotal}
                  onChange={(e) => setLocalTotal(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Simuler un nouveau total</label>
                <input
                  type="number"
                  min={1}
                  step={10}
                  className="input"
                  placeholder="Nouveau montant…"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                />
                {simDiff !== null && !isNaN(simDiff) && (
                  <p className={`text-xs mt-1 ${simDiff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {simDiff >= 0 ? '+' : ''}{formatAmount(simDiff, currency.symbol)} par rapport au budget actuel
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
