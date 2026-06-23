#!/bin/bash
# ============================================================
# LYNIS — Scanner de vulnérabilités OS (Étape 7)
# Exécuter sur chaque serveur EC2 à scanner
# ============================================================

set -euo pipefail

REPORT_DATE=$(date '+%Y-%m-%d_%H-%M')
REPORT_FILE="/tmp/lynis-report-$(hostname)-$REPORT_DATE.txt"
AUDIT_LOG="/var/log/lynis-audit.log"

echo ""
echo "============================================================"
echo "        LYNIS — Scan de vulnérabilités OS"
echo "============================================================"
echo "Hôte   : $(hostname)"
echo "Date   : $(date)"
echo "Rapport: $REPORT_FILE"
echo ""

# ---- Installation Lynis ----
if ! command -v lynis &>/dev/null; then
    echo "Installation de Lynis..."
    if command -v apt-get &>/dev/null; then
        apt-get update -qq
        apt-get install -y lynis
    elif command -v yum &>/dev/null; then
        yum install -y lynis
    else
        # Installation manuelle depuis les sources
        cd /tmp
        wget -q https://downloads.cisofy.com/lynis/lynis-3.0.9.tar.gz
        tar xzf lynis-3.0.9.tar.gz
        mv lynis /usr/local/lynis
        ln -sf /usr/local/lynis/lynis /usr/local/bin/lynis
    fi
    echo "Lynis installé."
fi

# ---- Lancer le scan système complet ----
echo "Démarrage du scan système (peut prendre 2-5 minutes)..."
echo ""

# Scan en mode non-interactif avec rapport
lynis audit system \
    --quiet \
    --no-colors \
    --logfile "$AUDIT_LOG" \
    --report-file "$REPORT_FILE" \
    2>&1

echo ""
echo "============================================================"
echo "                  RÉSUMÉ DU SCAN"
echo "============================================================"

# Extraire le score Hardening
SCORE=$(grep "hardening_index=" "$REPORT_FILE" 2>/dev/null | cut -d= -f2 || echo "N/A")
echo "Score de durcissement (Hardening Index) : $SCORE / 100"
echo ""

# Compter les findings par catégorie
WARNINGS=$(grep -c "^warning=" "$REPORT_FILE" 2>/dev/null || echo "0")
SUGGESTIONS=$(grep -c "^suggestion=" "$REPORT_FILE" 2>/dev/null || echo "0")
echo "Avertissements (Warnings)  : $WARNINGS"
echo "Suggestions                : $SUGGESTIONS"
echo ""

# Afficher les warnings critiques
echo "------------------------------------------------------------"
echo "WARNINGS (à corriger en priorité) :"
echo "------------------------------------------------------------"
grep "^warning=" "$REPORT_FILE" 2>/dev/null | head -20 | sed 's/^warning=/  - /' || echo "  Aucun warning"

echo ""
echo "------------------------------------------------------------"
echo "TOP 10 SUGGESTIONS :"
echo "------------------------------------------------------------"
grep "^suggestion=" "$REPORT_FILE" 2>/dev/null | head -10 | sed 's/^suggestion=/  - /' || echo "  Aucune suggestion"

echo ""
echo "Rapport complet sauvegardé : $REPORT_FILE"
echo "Log d'audit : $AUDIT_LOG"
echo ""
echo "Pour transférer le rapport vers votre machine locale :"
echo "  scp -i <keypair.pem> ubuntu@<BASTION_IP>:<path_to_web_server>:$REPORT_FILE ./lynis-report.txt"
