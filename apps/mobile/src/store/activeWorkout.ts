import { create } from 'zustand';
import type { WorkoutSet } from '@project_fit/shared';

export interface ActiveSet extends WorkoutSet {
  completed: boolean;
}
export interface ActiveExercise {
  exerciseId: string;
  name: string;
  sets: ActiveSet[];
}

interface ActiveWorkoutState {
  active: boolean;
  name: string;
  startedAt: number | null;
  clientUuid: string | null;
  exercises: ActiveExercise[];
  start: (name: string) => void;
  addExercise: (exerciseId: string, name: string) => void;
  removeExercise: (index: number) => void;
  addSet: (exIndex: number, prefill?: Partial<ActiveSet>) => void;
  updateSet: (exIndex: number, setIndex: number, patch: Partial<ActiveSet>) => void;
  removeSet: (exIndex: number, setIndex: number) => void;
  reset: () => void;
}

function uuid(): string {
  // RFC4122 v4 (suffisant pour un identifiant d'idempotence côté client).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useActiveWorkout = create<ActiveWorkoutState>((set) => ({
  active: false,
  name: '',
  startedAt: null,
  clientUuid: null,
  exercises: [],
  start: (name) =>
    set({ active: true, name, startedAt: Date.now(), clientUuid: uuid(), exercises: [] }),
  addExercise: (exerciseId, name) =>
    set((s) => ({ exercises: [...s.exercises, { exerciseId, name, sets: [] }] })),
  removeExercise: (index) =>
    set((s) => ({ exercises: s.exercises.filter((_, i) => i !== index) })),
  addSet: (exIndex, prefill) =>
    set((s) => {
      const exercises = s.exercises.map((ex, i) => {
        if (i !== exIndex) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const newSet: ActiveSet = {
          weightKg: prefill?.weightKg ?? last?.weightKg ?? 0,
          reps: prefill?.reps ?? last?.reps ?? 0,
          isWarmup: prefill?.isWarmup ?? false,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { exercises };
    }),
  updateSet: (exIndex, setIndex, patch) =>
    set((s) => ({
      exercises: s.exercises.map((ex, i) =>
        i !== exIndex ? ex : { ...ex, sets: ex.sets.map((st, j) => (j === setIndex ? { ...st, ...patch } : st)) },
      ),
    })),
  removeSet: (exIndex, setIndex) =>
    set((s) => ({
      exercises: s.exercises.map((ex, i) =>
        i !== exIndex ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) },
      ),
    })),
  reset: () => set({ active: false, name: '', startedAt: null, clientUuid: null, exercises: [] }),
}));
