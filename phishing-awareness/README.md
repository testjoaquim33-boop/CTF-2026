# Bibliothèque de Templates — Campagne de Sensibilisation au Phishing

> **USAGE STRICTEMENT INTERNE ET AUTORISÉ**  
> Ces templates sont destinés exclusivement à des campagnes de sensibilisation cybersécurité internes et autorisées.  
> Aucun lien malveillant réel. Aucun malware. Aucun payload. Usage éducatif uniquement.

---

## Structure du dépôt

```
phishing-awareness/
├── README.md                    ← Ce fichier (guide complet)
├── templates/                   ← Templates HTML (compatibles Outlook)
│   ├── 01-windows-defender-alerte-FR.html
│   ├── 02-m365-expiration-mdp-FR.html
│   ├── 03-teams-fichier-partage-FR.html
│   ├── 04-onedrive-stockage-FR.html
│   ├── 05-mfa-verification-FR.html
│   ├── 06-suspicious-login-EN.html
│   ├── 07-quarantaine-email-FR.html
│   └── 08-endpoint-security-EN.html
├── plain-text/                  ← Versions texte brut de chaque template
└── metadata/
    └── templates.json           ← Index complet (métadonnées, indicateurs, débriefing)
```

---

## Placeholders disponibles

| Placeholder          | Description                                |
|----------------------|--------------------------------------------|
| `{{prenom}}`         | Prénom du destinataire                     |
| `{{nom}}`            | Nom du destinataire                        |
| `{{email}}`          | Adresse email du destinataire              |
| `{{entreprise}}`     | Nom de l'entreprise                        |
| `{{lien}}`           | URL de la page de capture (votre outil)    |
| `{{support}}`        | Email/URL du support interne               |
| `{{date}}`           | Date d'expiration / d'alerte               |
| `{{ip_fictive}}`     | Adresse IP fictive pour les alertes        |
| `{{ville_fictive}}`  | Ville fictive pour les alertes géo         |
| `{{expediteur}}`     | Nom d'un expéditeur interne fictif         |

---

## Index des templates

| # | Fichier | Thème | Langue | Niveau | Leviers psycho |
|---|---------|-------|--------|--------|----------------|
| 01 | `01-windows-defender-alerte-FR.html` | Windows Defender — Menace détectée | FR | Moyen | Peur, Urgence, Autorité |
| 02 | `02-m365-expiration-mdp-FR.html` | Microsoft 365 — Expiration mot de passe | FR | Facile | Urgence, Peur perte d'accès |
| 03 | `03-teams-fichier-partage-FR.html` | Teams — Fichier confidentiel partagé | FR | Avancé | Curiosité, Autorité, Confiance |
| 04 | `04-onedrive-stockage-FR.html` | OneDrive — Stockage saturé | FR | Facile | Urgence, Peur perte de données |
| 05 | `05-mfa-verification-FR.html` | MFA — Vérification supplémentaire requise | FR | Moyen | Urgence, Autorité, Peur |
| 06 | `06-suspicious-login-EN.html` | Suspicious login alert | EN | Avancé | Peur, Urgence, Autorité |
| 07 | `07-quarantaine-email-FR.html` | Quarantaine email Exchange | FR | Moyen | Curiosité, Urgence, Peur |
| 08 | `08-endpoint-security-EN.html` | Endpoint Security — Compliance violation | EN | Avancé | Peur, Urgence, Autorité |

---

## Adaptation par population cible

### RH (Ressources Humaines)
- Privilégier les templates **Teams** (partage de document RH/contrat) et **OneDrive** (dossier employé).
- Expéditeur fictif : DRH, direction, cabinet de recrutement.
- Message : "Votre contrat de révision salariale est disponible."
- Niveau recommandé : **Facile à Moyen**.

### Finance / Comptabilité
- Templates **MFA**, **connexion suspecte** et **expiration MDP** les plus pertinents.
- Contexte : validation de virement, accès ERP, clôture mensuelle.
- Ajouter un sentiment d'urgence temporelle (fin de mois, audit).
- Niveau recommandé : **Moyen à Avancé**.

### Direction / COMEX
- Templates **Suspicious Login** et **Endpoint Security** avec personnalisation maximale.
- Mentionner des voyages récents ou des connexions depuis l'étranger.
- Niveau recommandé : **Avancé** (spear phishing).
- Attention : obtenir validation du RSSI avant envoi à la direction.

### IT / Support Technique
- Population plus difficile à tromper : utiliser les templates les plus sophistiqués.
- Templates **Endpoint Security** et **Windows Defender** avec des détails techniques précis.
- Ajouter de faux hash SHA256, noms de processus crédibles.
- Niveau recommandé : **Avancé**.

### Étudiants / Nouveaux arrivants
- Commencer par les niveaux **Facile** pour construire la culture de base.
- Templates **OneDrive** (accès aux cours/documents) et **Expiration MDP**.
- Débriefing immédiat et pédagogique recommandé.
- Niveau recommandé : **Facile**.

### Support Technique (Tier 1/2)
- Templates **Quarantaine email** et **MFA** très efficaces.
- Ces populations traitent régulièrement des vraies alertes : le volume les rend vulnérables.
- Insister sur la vérification du domaine expéditeur dans le débriefing.
- Niveau recommandé : **Moyen**.

---

## Conseils d'utilisation

### Avant la campagne
1. Obtenir l'autorisation écrite de la direction et du DPO.
2. Informer l'équipe juridique.
3. Configurer votre plateforme de simulation (GoPhish, KnowBe4, Proofpoint, etc.).
4. Remplacer `{{lien}}` par l'URL de capture de votre outil.
5. Tester l'email sur Outlook 2016/2019/365, Gmail, Apple Mail avant envoi.
6. Configurer le domaine expéditeur dans SPF/DKIM (domaine de test, pas de production).

### Pendant la campagne
- Ne jamais envoyer depuis l'infrastructure de production.
- Journaliser tous les clics (outil dédié uniquement, pas de collecte de credentials réels).
- Prévoir une page de débrief immédiat après le clic (`{{lien}}` → page pédagogique).

### Après la campagne
- Débriefing collectif dans les 48h.
- Partager les indicateurs de compromission que les utilisateurs auraient dû repérer.
- Ne pas stigmatiser les utilisateurs ayant cliqué.
- Proposer une formation complémentaire (micro-learning recommandé).

---

## Compatibilité clients email

| Client | Compatibilité |
|--------|--------------|
| Outlook 2016 | ✅ Testé |
| Outlook 2019 | ✅ Testé |
| Outlook 365 (desktop) | ✅ Testé |
| Outlook Web App (OWA) | ✅ Testé |
| Gmail (web) | ✅ Testé |
| Apple Mail | ✅ Testé |
| Thunderbird | ✅ Testé |
| Samsung Mail | ⚠️ Rendu basique acceptable |

**Notes techniques :**
- Layouts en tableaux HTML uniquement (pas de flexbox/grid).
- CSS inline uniquement.
- Pas de shorthand CSS (`padding-top` au lieu de `padding`).
- Attributs HTML `bgcolor`, `width`, `align` pour la compatibilité Outlook.
- Pas de media queries (ignorées par Outlook desktop).

---

## Mentions légales et éthiques

Ces templates sont fournis à des fins exclusivement défensives et éducatives dans le cadre de campagnes de sensibilisation internes autorisées. Toute utilisation à des fins malveillantes est illégale et contraire à l'éthique. L'auteur décline toute responsabilité en cas d'usage détourné.

Références légales (France) : Articles 323-1 à 323-7 du Code Pénal (accès frauduleux à un système informatique). RGPD Article 32 (obligation de sensibilisation).
