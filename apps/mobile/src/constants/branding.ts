/**
 * Point unique de renommage de l'application.
 * Changer le nom / bundle id ici (et rien d'autre en dur ailleurs).
 * Nom de code temporaire : PROJECT_FIT.
 */
export const BRANDING = {
  // Nom affiché (écrans, splash). Temporaire.
  appName: 'PROJECT_FIT',
  // Slug technique Expo.
  slug: 'project-fit',
  // Identifiants stores (à figer avant le 1er build de prod).
  iosBundleIdentifier: 'com.projectfit.app',
  androidPackage: 'com.projectfit.app',
  // Scheme deep-link (partage / viral loop).
  scheme: 'projectfit',
  // Couleur de marque primaire (voir theme/colors.ts).
  primaryColor: '#FF4D2E',
} as const;

export type Branding = typeof BRANDING;
