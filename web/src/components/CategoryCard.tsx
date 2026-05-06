'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { CategoryStats } from '@/lib/types';
import { formatAmount } from '@/lib/budgetLogic';
import clsx from 'clsx';

interface Props {
  stat: CategoryStats;
  currencySymbol: string;
  onUpdate: (id: string, changes: { name?: string; icon?: string; budgetAmount?: number }) => void;
  onDelete: (id: string) => void;
  onAddExpense: (categoryId: string) => void;
}

export default function CategoryCard({ stat, currencySymbol, onUpdate, onDelete, onAddExpense }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(stat.name);
  const [editBudget, setEditBudget] = useState(String(stat.budgetAmount));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = () => {
    const newBudget = parseFloat(editBudget);
    onUpdate(stat.id, {
      name: editName.trim() || stat.name,
      budgetAmount: isNaN(newBudget) ? undefined : newBudget,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(stat.name);
    setEditBudget(String(stat.budgetAmount));
    setEditing(false);
  };

  const isOverBudget = stat.spent > stat.budgetAmount;
  const fillColor = isOverBudget ? '#ef4444' : stat.color;

  return (
    <div className="card group animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icon badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: stat.color + '22', border: `2px solid ${stat.color}44` }}
        >
          {stat.icon}
        </div>

        {/* Name / editing */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              className="input text-sm py-1 font-semibold"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          ) : (
            <p className="font-semibold text-slate-900 dark:text-white truncate">{stat.name}</p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">
            {formatAmount(stat.spent, currencySymbol)} dépensés
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave}   className="btn-ghost p-1.5 text-emerald-600"><Check size={15} /></button>
              <button onClick={handleCancel} className="btn-ghost p-1.5 text-red-500"><X size={15} /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} />
              </button>
              <button onClick={() => onDelete(stat.id)} className="btn-danger p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Budget input or display */}
      {editing ? (
        <div className="mb-3">
          <label className="label text-xs">Budget ({currencySymbol})</label>
          <input
            type="number"
            min={0}
            step={10}
            className="input text-sm py-1"
            value={editBudget}
            onChange={(e) => setEditBudget(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            Les autres catégories s&apos;ajustent automatiquement.
          </p>
        </div>
      ) : (
        <div className="flex justify-between items-baseline mb-2 text-sm">
          <span className="font-bold text-slate-900 dark:text-white">
            {formatAmount(stat.budgetAmount, currencySymbol)}
          </span>
          <span className={clsx('text-xs font-medium', isOverBudget ? 'text-red-500' : 'text-slate-400')}>
            {isOverBudget
              ? `−${formatAmount(stat.spent - stat.budgetAmount, currencySymbol)} dépassement`
              : `${formatAmount(stat.remaining, currencySymbol)} restant`}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="progress-bar mb-3">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, stat.percentage)}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>

      {/* Footer: % + CTA */}
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            'badge text-xs',
            isOverBudget
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : stat.percentage > 80
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          )}
        >
          {Math.round(stat.percentage)}% utilisé
        </span>
        <button
          onClick={() => onAddExpense(stat.id)}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          + Dépense
        </button>
      </div>
    </div>
  );
}
