// Point unique de renommage de l'app — lu par app.config.ts (Node) ET par l'app (Metro).
// CommonJS pour être résolu par le chargeur de config d'Expo.
const BRANDING = {
  appName: 'PROJECT_FIT',
  slug: 'project-fit',
  iosBundleIdentifier: 'com.projectfit.app',
  androidPackage: 'com.projectfit.app',
  scheme: 'projectfit',
  primaryColor: '#FF4D2E',
};
module.exports = { BRANDING };
