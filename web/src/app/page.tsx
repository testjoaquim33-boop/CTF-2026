'use client';

import { useState, useMemo } from 'react';
import { PlusCircle } from 'lucide-react';

import { useBudget } from '@/hooks/useBudget';
import { computeCategoryStats, totalSpent } from '@/lib/budgetLogic';
import { CURRENCIES } from '@/lib/types';

import Header        from '@/components/Header';
import BudgetSetup   from '@/components/BudgetSetup';
import CategoryCard  from '@/components/CategoryCard';
import AddCategoryForm from '@/components/AddCategoryForm';
import ExpenseModal  from '@/components/ExpenseModal';
import ExpenseList   from '@/components/ExpenseList';
import Dashboard     from '@/components/Dashboard';

type Tab = 'dashboard' | 'categories' | 'expenses';

export default function HomePage() {
  const { state, setTotal, setMeta, addCategory, updateCategory, removeCategory, addExpense, removeExpense } =
    useBudget();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; categoryId?: string }>({ open: false });

  const currency = CURRENCIES.find((c) => c.code === state.currency) ?? CURRENCIES[0];
  const stats = useMemo(
    () => computeCategoryStats(state.categories, state.expenses),
    [state.categories, state.expenses],
  );
  const spent = useMemo(() => totalSpent(state.expenses), [state.expenses]);

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'dashboard',  label: 'Dashboard',  emoji: '📊' },
    { id: 'categories', label: 'Catégories', emoji: '🗂️' },
    { id: 'expenses',   label: 'Dépenses',   emoji: '💸' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header state={state} />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Budget setup card */}
        <BudgetSetup state={state} onSetTotal={setTotal} onSetMeta={setMeta} />

        {/* Quick stats ribbon */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {state.categories.length} catégorie{state.categories.length !== 1 ? 's' : ''}
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {state.expenses.length} dépense{state.expenses.length !== 1 ? 's' : ''}
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {currency.symbol}{spent.toFixed(2)} / {currency.symbol}{state.totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl transition-all
                ${tab === t.id
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab content */}
        {tab === 'dashboard' && (
          <Dashboard
            totalBudget={state.totalAmount}
            currency={state.currency}
            stats={stats}
            expenses={state.expenses}
          />
        )}

        {tab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Catégories de budget</h2>
              <button
                onClick={() => setExpenseModal({ open: true })}
                className="btn-primary flex items-center gap-1.5 text-sm"
              >
                <PlusCircle size={16} />
                Dépense rapide
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((s) => (
                <CategoryCard
                  key={s.id}
                  stat={s}
                  currencySymbol={currency.symbol}
                  onUpdate={updateCategory}
                  onDelete={removeCategory}
                  onAddExpense={(catId) => setExpenseModal({ open: true, categoryId: catId })}
                />
              ))}
              <AddCategoryForm
                totalBudget={state.totalAmount}
                currencySymbol={currency.symbol}
                onAdd={addCategory}
              />
            </div>

            {/* Budget sanity check */}
            {state.categories.length > 0 && (
              <div className="text-xs text-slate-400 text-center">
                Total alloué :{' '}
                <strong className="text-slate-600 dark:text-slate-300">
                  {currency.symbol}
                  {state.categories.reduce((s, c) => s + c.budgetAmount, 0).toFixed(2)}
                </strong>{' '}
                / {currency.symbol}{state.totalAmount.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {tab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Suivi des dépenses</h2>
              <button
                onClick={() => setExpenseModal({ open: true })}
                className="btn-primary flex items-center gap-1.5 text-sm"
              >
                <PlusCircle size={16} />
                Ajouter
              </button>
            </div>
            <ExpenseList
              expenses={state.expenses}
              categories={state.categories}
              currencySymbol={currency.symbol}
              onRemove={removeExpense}
            />
          </div>
        )}
      </main>

      {/* Expense modal */}
      {expenseModal.open && (
        <ExpenseModal
          categories={state.categories}
          defaultCategoryId={expenseModal.categoryId}
          currencySymbol={currency.symbol}
          onAdd={addExpense}
          onClose={() => setExpenseModal({ open: false })}
        />
      )}
    </div>
  );
}
