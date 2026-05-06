'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { v4 as uuid } from 'uuid';
import {
  BudgetState,
  Category,
  Expense,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from '@/lib/types';
import {
  redistributeOnCategoryChange,
  addCategoryWithRedistribution,
  removeCategoryWithRedistribution,
} from '@/lib/budgetLogic';
import { loadState, saveState } from '@/lib/storage';

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'LOAD';                payload: BudgetState }
  | { type: 'SET_TOTAL';           payload: number }
  | { type: 'SET_META';            payload: Partial<Pick<BudgetState, 'name' | 'currency' | 'startDate' | 'endDate'>> }
  | { type: 'ADD_CATEGORY';        payload: { name: string; icon: string; amount: number } }
  | { type: 'UPDATE_CATEGORY';     payload: { id: string; name?: string; icon?: string; budgetAmount?: number } }
  | { type: 'REMOVE_CATEGORY';     payload: string }
  | { type: 'ADD_EXPENSE';         payload: { categoryId: string; description: string; amount: number; date: string } }
  | { type: 'REMOVE_EXPENSE';      payload: string }
  | { type: 'RESET' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: BudgetState, action: Action): BudgetState {
  switch (action.type) {
    case 'LOAD':
      return action.payload;

    case 'SET_TOTAL': {
      const newTotal = Math.max(0, action.payload);
      const oldTotal = state.totalAmount;
      if (oldTotal === 0) return { ...state, totalAmount: newTotal };
      // Scale all categories proportionally
      const factor = newTotal / oldTotal;
      return {
        ...state,
        totalAmount: newTotal,
        categories: state.categories.map((c) => ({
          ...c,
          budgetAmount: Math.round(c.budgetAmount * factor * 100) / 100,
        })),
      };
    }

    case 'SET_META':
      return { ...state, ...action.payload };

    case 'ADD_CATEGORY': {
      const colorIndex = state.categories.length % CATEGORY_COLORS.length;
      const newCat: Category = {
        id: uuid(),
        name: action.payload.name,
        icon: action.payload.icon || CATEGORY_ICONS[action.payload.name] || '📦',
        budgetAmount: action.payload.amount,
        color: CATEGORY_COLORS[colorIndex],
      };
      return {
        ...state,
        categories: addCategoryWithRedistribution(state.categories, newCat, state.totalAmount),
      };
    }

    case 'UPDATE_CATEGORY': {
      const { id, budgetAmount, ...rest } = action.payload;
      let updated = state.categories.map((c) =>
        c.id === id ? { ...c, ...rest } : c,
      );
      if (budgetAmount !== undefined) {
        updated = redistributeOnCategoryChange(updated, id, budgetAmount);
      }
      return { ...state, categories: updated };
    }

    case 'REMOVE_CATEGORY':
      return {
        ...state,
        categories: removeCategoryWithRedistribution(state.categories, action.payload),
        expenses: state.expenses.filter((e) => e.categoryId !== action.payload),
      };

    case 'ADD_EXPENSE': {
      const expense: Expense = { id: uuid(), ...action.payload };
      return { ...state, expenses: [expense, ...state.expenses] };
    }

    case 'REMOVE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.payload) };

    case 'RESET':
      return loadState();

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBudget() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const setTotal = useCallback((amount: number) => dispatch({ type: 'SET_TOTAL', payload: amount }), []);
  const setMeta  = useCallback((meta: Partial<Pick<BudgetState, 'name' | 'currency' | 'startDate' | 'endDate'>>) =>
    dispatch({ type: 'SET_META', payload: meta }), []);

  const addCategory = useCallback(
    (name: string, icon: string, amount: number) =>
      dispatch({ type: 'ADD_CATEGORY', payload: { name, icon, amount } }),
    [],
  );

  const updateCategory = useCallback(
    (id: string, changes: { name?: string; icon?: string; budgetAmount?: number }) =>
      dispatch({ type: 'UPDATE_CATEGORY', payload: { id, ...changes } }),
    [],
  );

  const removeCategory = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_CATEGORY', payload: id }),
    [],
  );

  const addExpense = useCallback(
    (categoryId: string, description: string, amount: number, date: string) =>
      dispatch({ type: 'ADD_EXPENSE', payload: { categoryId, description, amount, date } }),
    [],
  );

  const removeExpense = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_EXPENSE', payload: id }),
    [],
  );

  return {
    state,
    setTotal,
    setMeta,
    addCategory,
    updateCategory,
    removeCategory,
    addExpense,
    removeExpense,
  };
}
