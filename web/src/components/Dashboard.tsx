'use client';

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CategoryStats, CURRENCIES } from '@/lib/types';
import { formatAmount, totalSpent } from '@/lib/budgetLogic';
import { Expense } from '@/lib/types';
import clsx from 'clsx';

interface Props {
  totalBudget: number;
  currency: string;
  stats: CategoryStats[];
  expenses: Expense[];
}

export default function Dashboard({ totalBudget, currency, stats, expenses }: Props) {
  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '€';
  const spent = totalSpent(expenses);
  const remaining = totalBudget - spent;
  const pct = totalBudget > 0 ? Math.min(100, (spent / totalBudget) * 100) : 0;
  const isOver = remaining < 0;

  // Pie data: show both used and unspent
  const pieData = stats.map((s) => ({
    name: `${s.icon} ${s.name}`,
    value: s.budgetAmount,
    color: s.color,
    spent: s.spent,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-bold mb-1">{d.name}</p>
        <p>Budget : {formatAmount(d.value, sym)}</p>
        <p>Dépensé : {formatAmount(d.spent, sym)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Global summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Budget total" value={formatAmount(totalBudget, sym)} color="text-slate-900 dark:text-white" />
        <SummaryCard label="Dépensé"      value={formatAmount(spent, sym)}       color="text-amber-600 dark:text-amber-400" />
        <SummaryCard
          label="Restant"
          value={formatAmount(Math.abs(remaining), sym)}
          color={isOver ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
          prefix={isOver ? '−' : ''}
        />
      </div>

      {/* Global progress */}
      <div className="card">
        <div className="flex justify-between items-center mb-2 text-sm font-medium">
          <span>Avancement global</span>
          <span className={clsx(isOver ? 'text-red-500' : 'text-slate-500')}>{Math.round(pct)}%</span>
        </div>
        <div className="progress-bar h-3">
          <div
            className="progress-fill"
            style={{ width: `${pct}%`, backgroundColor: isOver ? '#ef4444' : '#3b82f6' }}
          />
        </div>
      </div>

      {/* Pie chart */}
      {stats.length > 0 && (
        <div className="card">
          <p className="font-semibold text-sm mb-3 text-slate-700 dark:text-slate-300">Répartition du budget</p>
          <ResponsiveContainer width="100%" height={220}>
            <RePieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>
                )}
              />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-category progress bars */}
      {stats.length > 0 && (
        <div className="card space-y-3">
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Détail par catégorie</p>
          {stats.map((s) => (
            <div key={s.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">
                  {s.icon} {s.name}
                </span>
                <span className={s.spent > s.budgetAmount ? 'text-red-500' : 'text-slate-400'}>
                  {formatAmount(s.spent, sym)} / {formatAmount(s.budgetAmount, sym)}
                </span>
              </div>
              <div className="progress-bar h-2">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, s.percentage)}%`,
                    backgroundColor: s.spent > s.budgetAmount ? '#ef4444' : s.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  prefix = '',
}: {
  label: string;
  value: string;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="card p-3 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-base font-bold ${color} leading-tight`}>
        {prefix}{value}
      </p>
    </div>
  );
}
