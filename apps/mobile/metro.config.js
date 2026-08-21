// Metro config pour un monorepo (npm workspaces).
// Permet à Metro de résoudre les paquets hoistés à la racine ET le code
// partagé (@project_fit/shared) situé hors du dossier de l'app.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Surveiller toute la racine du monorepo (pour packages/shared).
config.watchFolders = [workspaceRoot];

// 2. Chercher les modules dans l'app PUIS à la racine (deps hoistées).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
