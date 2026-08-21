/**
 * Point unique de renommage : les valeurs vivent dans `app.branding.js`
 * (racine du package mobile), lues aussi par `app.config.ts`. Ce module les
 * ré-exporte avec les types pour l'app.
 */
import { BRANDING } from '../../app.branding.js';

export { BRANDING };
export type Branding = typeof BRANDING;
