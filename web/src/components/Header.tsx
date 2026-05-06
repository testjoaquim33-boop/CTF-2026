'use client';

import { Moon, Sun, Download, PalmtreeIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BudgetState } from '@/lib/types';
import { exportStateAsCSV, exportStateAsJSON } from '@/lib/storage';

interface Props {
  state: BudgetState;
}

export default function Header({ state }: Props) {
  const [dark, setDark] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(saved === 'dark' || (!saved && prefersDark));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 text-lg">
          <span className="text-xl">🌴</span>
          <span className="hidden sm:block">Budget Vacances</span>
        </div>

        {/* Trip name */}
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
          {state.name}
        </span>

        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="btn-ghost flex items-center gap-1.5 text-sm"
              title="Exporter"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {exportOpen && (
              <div
                className="absolute right-0 mt-1 w-44 card p-1 shadow-lg animate-slide-in"
                onBlur={() => setExportOpen(false)}
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  onClick={() => { exportStateAsJSON(state); setExportOpen(false); }}
                >
                  📄 Export JSON
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  onClick={() => { exportStateAsCSV(state); setExportOpen(false); }}
                >
                  📊 Export CSV
                </button>
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark((d) => !d)}
            className="btn-ghost p-2"
            title={dark ? 'Mode clair' : 'Mode sombre'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
