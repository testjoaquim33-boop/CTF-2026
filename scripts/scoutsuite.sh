#!/bin/bash
# ============================================================
# SCOUTSUITE — CSPM Scan (Étape 8)
# Cloud Security Posture Management
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo "============================================================"
echo "        SCOUTSUITE — CSPM Scan AWS — SDV Cloud"
echo "============================================================"
echo ""

# ---- Vérifier Python et pip ----
if ! command -v python3 &>/dev/null; then
    echo "Python3 requis. Installation..."
    apt-get install -y python3 python3-pip python3-venv
fi

# ---- Installer ScoutSuite dans un venv ----
VENV_DIR="$HOME/.scoutsuite-venv"
if [ ! -d "$VENV_DIR" ]; then
    info "Création de l'environnement virtuel ScoutSuite..."
    python3 -m venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"
    pip install --quiet scoutsuite
    ok "ScoutSuite installé"
else
    source "$VENV_DIR/bin/activate"
    ok "Environnement ScoutSuite existant chargé"
fi

# ---- Vérifier les credentials AWS ----
info "Vérification des credentials AWS..."
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
if [ -z "$AWS_ACCOUNT" ]; then
    echo -e "${RED}[ERREUR]${NC} Credentials AWS non configurés."
    echo "Exécuter : aws configure"
    exit 1
fi
ok "Compte AWS : $AWS_ACCOUNT"
AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
info "Identité : $AWS_USER"

# ---- Lancer le scan ScoutSuite ----
REPORT_DIR="$(dirname "$0")/../docs/scoutsuite-report"
mkdir -p "$REPORT_DIR"

echo ""
info "Lancement du scan ScoutSuite sur AWS..."
info "Région : ${AWS_DEFAULT_REGION:-eu-west-1}"
info "Rapport : $REPORT_DIR"
echo ""
warn "Ce scan peut prendre 5 à 15 minutes selon le nombre de ressources."
echo ""

scout aws \
    --report-dir "$REPORT_DIR" \
    --report-name "scoutsuite-sdv-$(date +%Y%m%d-%H%M%S)" \
    --no-browser \
    2>&1 | tee "$REPORT_DIR/scan.log"

echo ""
ok "Scan terminé !"
echo ""
info "Rapport HTML disponible : $REPORT_DIR/"
info "Ouvrir le rapport dans un navigateur pour analyser les résultats."
echo ""
echo "Commandes utiles après le scan :"
echo "  # Compter les findings par sévérité :"
echo "  grep -c '\"level\": \"danger\"' $REPORT_DIR/*.js || true"
echo "  grep -c '\"level\": \"warning\"' $REPORT_DIR/*.js || true"
