import { useQuery } from '@tanstack/react-query';
import { fetchExercises, fetchExerciseById, type ExerciseFilters } from '../services/exercises';

export function useExercises(filters: ExerciseFilters = {}) {
  return useQuery({
    queryKey: ['exercises', filters],
    queryFn: () => fetchExercises(filters),
    staleTime: 1000 * 60 * 10, // contenu peu changeant
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: () => fetchExerciseById(id),
    enabled: !!id,
  });
}
