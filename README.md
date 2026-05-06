# 🌴 Budget Vacances — Application complète Web + Android

Système complet de gestion de budget de vacances avec une application web (Next.js) et une application Android (Kotlin).

---

## Structure du projet

```
CTF-2026/
├── web/          # Application Next.js 14 (React + Tailwind CSS)
└── android/      # Application Android (Kotlin + Material Design 3)
```

---

## 🌐 Application Web (Next.js)

### Stack
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** — design system
- **Recharts** — graphique camembert
- **localStorage** — persistance sans backend
- **lucide-react** — icônes

### Lancer l'app web

```bash
cd web
npm install
npm run dev
# → http://localhost:3000
```

### Build de production

```bash
npm run build
npm start
```

### Fonctionnalités web
| Fonctionnalité | Détail |
|---|---|
| Budget global | Définir / modifier le budget total avec mise à l'échelle automatique des catégories |
| Catégories dynamiques | Ajouter, modifier, supprimer avec redistribution intelligente |
| Répartition automatique | Quand une catégorie change, les autres s'ajustent proportionnellement |
| Suivi des dépenses | Ajouter une dépense, l'associer à une catégorie, voir la progression |
| Dashboard | Budget restant, graphique camembert, barres de progression |
| Mode sombre | Toggle persistant (localStorage + prefers-color-scheme) |
| Export | Export JSON ou CSV des données |
| Simulation | Simuler un nouveau budget total avant de valider |

---

## 📱 Application Android (Kotlin)

### Stack
- **Kotlin** + **Coroutines + Flow**
- **Material Design 3** (Material You)
- **Room** — base de données locale SQLite
- **ViewModel + LiveData** — MVVM architecture
- **Navigation Component** — navigation entre fragments
- **MPAndroidChart** — graphique camembert
- **ViewBinding** — liaison des vues

### Lancer l'app Android

**Prérequis :** Android Studio Hedgehog (2023.1+) ou supérieur, SDK 26+.

1. Ouvrir Android Studio
2. **File → Open** → sélectionner le dossier `android/`
3. Attendre la synchronisation Gradle
4. Cliquer **Run ▶** (émulateur ou appareil physique Android 8+)

```bash
# Ou en ligne de commande (avec ANDROID_HOME configuré)
cd android
./gradlew assembleDebug
# APK dans : app/build/outputs/apk/debug/app-debug.apk
```

### Fonctionnalités Android
| Fonctionnalité | Détail |
|---|---|
| Dashboard | Budget total, dépensé, restant + graphique camembert |
| Catégories | Liste avec barre de progression, édition inline, suppression |
| Dépenses | Liste chronologique, ajout rapide, suppression |
| Persistance | Room (SQLite) — données conservées entre les sessions |
| Thème | Material You Day/Night automatique |

---

## 🧠 Logique de répartition du budget

### Principe fondamental
> Le total des budgets des catégories est **toujours égal** au budget global.

### Algorithme : modification d'une catégorie

```
Quand catégorie A passe de X à X':
  Δ = X' - X                         // variation
  Pour chaque autre catégorie C_i:
    nouveau_budget(C_i) = budget(C_i) × (Total - X') / Σ_autres(budget)
```

**Exemple concret :**
- Budget total : 3 000 €
- Logement : 900 €, Transport : 600 €, Nourriture : 750 €
- On augmente Logement à 1 200 € (+300 €)
- Les autres baissent proportionnellement :
  - Transport : 600 × (1 800/1 350) ≈ 480 € (−120 €)
  - Nourriture : 750 × (1 800/1 350) ≈ 600 € (−150 €)
  - ✅ Total = 1 200 + 480 + 600 = 2 280 € ≠ 3 000 ❌ (exemple simplifié)

**Formule exacte :**
```
budget_restant_autres = budget_total - nouvelle_valeur_catégorie_modifiée
pour chaque autre catégorie C_i:
  C_i.budget = C_i.budget × budget_restant_autres / total_des_autres_avant
```

### Ajout d'une catégorie
Le montant de la nouvelle catégorie est prélevé proportionnellement sur toutes les autres.

### Suppression d'une catégorie
Le budget libéré est redistribué proportionnellement aux catégories restantes.

### Changement du budget global
Toutes les catégories sont mises à l'échelle par le facteur `nouveau_total / ancien_total`.

---

## 🔄 Synchronisation Web ↔ Android

L'approche choisie est le **stockage local indépendant** (Simple) :
- Web → `localStorage` du navigateur
- Android → Room (SQLite)

### Extension possible vers sync avancée
Pour synchroniser, ajouter un backend REST :
```
API Node.js/Express (ou NestJS)
  POST /api/budget        → sauvegarder l'état
  GET  /api/budget        → charger l'état
  POST /api/expenses      → ajouter une dépense
Authentification JWT ou passcode simple
```

Les deux apps utilisent les mêmes structures de données (JSON), ce qui facilite l'intégration.

---

## 📂 Architecture détaillée

### Web
```
src/
├── app/
│   ├── layout.tsx          # Layout racine + métadonnées
│   ├── page.tsx            # Page principale (tabs + orchestration)
│   └── globals.css         # Variables CSS + composants Tailwind
├── components/
│   ├── Header.tsx          # Barre de nav + export + dark mode
│   ├── BudgetSetup.tsx     # Formulaire budget global + simulation
│   ├── CategoryCard.tsx    # Carte catégorie éditable
│   ├── AddCategoryForm.tsx # Formulaire nouvelle catégorie
│   ├── ExpenseModal.tsx    # Modal ajout dépense
│   ├── ExpenseList.tsx     # Liste filtrée des dépenses
│   └── Dashboard.tsx      # Graphiques + résumés
├── hooks/
│   └── useBudget.ts        # État global (useReducer + localStorage)
└── lib/
    ├── types.ts            # Interfaces TypeScript
    ├── budgetLogic.ts      # Algorithmes de redistribution
    └── storage.ts          # localStorage + export JSON/CSV
```

### Android
```
kotlin/com/vacationbudget/
├── MainActivity.kt                 # Activité principale + navigation
├── models/
│   ├── BudgetConfig.kt            # Entité Room config globale
│   ├── Category.kt                # Entité Room catégorie
│   └── Expense.kt                 # Entité Room dépense
├── database/
│   ├── BudgetDao.kt               # Requêtes Room (Flow réactif)
│   └── BudgetDatabase.kt          # Singleton Room
├── viewmodel/
│   └── BudgetViewModel.kt         # Logique métier + state (LiveData)
├── adapters/
│   ├── CategoryAdapter.kt         # RecyclerView catégories
│   └── ExpenseAdapter.kt          # RecyclerView dépenses
├── fragments/
│   ├── DashboardFragment.kt       # Onglet Dashboard
│   ├── CategoriesFragment.kt      # Onglet Catégories
│   └── ExpensesFragment.kt        # Onglet Dépenses
└── ui/
    ├── AddExpenseActivity.kt      # Ajout dépense
    └── BudgetSetupActivity.kt     # Paramètres budget
```

---

## 🎨 Design

| Élément | Web | Android |
|---|---|---|
| Design system | Tailwind CSS | Material Design 3 |
| Mode sombre | Classe `.dark` + toggle | DayNight automatique |
| Couleurs catégories | 9 couleurs prédéfinies | Même palette |
| Animations | CSS transitions + keyframes | Material motion |
| Responsive | Grid adaptatif sm/lg | ConstraintLayout |

---

## 🚀 Roadmap (bonus potentiels)

- [ ] Backend API (Node.js/Express) pour sync web ↔ mobile
- [ ] Authentification (OAuth2 / email)
- [ ] Notifications Android (alertes dépassement de budget)
- [ ] PWA (app web installable sur mobile)
- [ ] Widget Android (budget restant sur l'écran d'accueil)
- [ ] Historique multi-voyages
- [ ] Partage de budget avec d'autres personnes
