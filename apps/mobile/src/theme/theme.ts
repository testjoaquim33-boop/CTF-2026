import { darkColors, lightColors, type ColorScheme } from './colors';
import { spacing, radius, typography, durations } from './tokens';

export interface Theme {
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  durations: typeof durations;
  isDark: boolean;
}

export const darkTheme: Theme = {
  colors: darkColors, spacing, radius, typography, durations, isDark: true,
};
export const lightTheme: Theme = {
  colors: lightColors, spacing, radius, typography, durations, isDark: false,
};

export { spacing, radius, typography, durations };
