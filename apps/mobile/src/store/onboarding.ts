import { create } from 'zustand';
import type { OnboardingDraft } from '@project_fit/shared';

interface OnboardingState {
  draft: OnboardingDraft;
  set: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
}

/** État progressif du parcours d'onboarding (avant persistance). */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  draft: {},
  set: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  reset: () => set({ draft: {} }),
}));
