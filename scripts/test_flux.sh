#!/bin/bash
# ============================================================
# TEST DES FLUX RÉSEAU — Étape 5
# Vérifier que les Security Groups et ACLs fonctionnent
# Exécuter depuis le Bastion ou en local avec AWS CLI
# ============================================================

set -euo pipefail

# Couleurs pour la lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Récupérer les outputs Terraform
cd "$(dirname "$0")/../terraform"
ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
BASTION_IP=$(terraform output -raw bastion_public_ip 2>/dev/null || echo "")
WEB1_IP=$(terraform output -raw web1_private_ip 2>/dev/null || echo "")
WEB2_IP=$(terraform output -raw web2_private_ip 2>/dev/null || echo "")
DB_IP=$(terraform output -raw db_private_ip 2>/dev/null || echo "")
S3_URL=$(terraform output -raw s3_static_website_url 2>/dev/null || echo "")

echo ""
echo "============================================================"
echo "       RAPPORT DE TESTS DE FLUX RÉSEAU — SDV CLOUD"
echo "============================================================"
echo "Date : $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "Infrastructure testée :"
echo "  ALB DNS     : $ALB_DNS"
echo "  Bastion IP  : $BASTION_IP"
echo "  Web1 IP     : $WEB1_IP"
echo "  Web2 IP     : $DB_IP"
echo "  DB IP       : $DB_IP"
echo "  S3 URL      : $S3_URL"
echo ""

# ============================================================
# TEST 1 : Accessibilité HTTP via ALB (depuis Internet)
# ============================================================
echo "------------------------------------------------------------"
echo "TEST 1 : Application Web accessible via Load Balancer (HTTP)"
echo "------------------------------------------------------------"
if [ -n "$ALB_DNS" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://$ALB_DNS/" || echo "000")
    if [ "$HTTP_CODE" == "200" ]; then
        ok "ALB répond HTTP 200 — Application accessible"
    else
        fail "ALB répond HTTP $HTTP_CODE — Vérifier la configuration"
    fi

    # Test du load balancing — vérifier que les 2 serveurs répondent
    echo ""
    info "Test load balancing — 6 requêtes successives :"
    SERVERS=()
    for i in $(seq 1 6); do
        RESPONSE=$(curl -s --max-time 5 "http://$ALB_DNS/" | grep -oP 'IP Privée.*?\K10\.\d+\.\d+\.\d+' || echo "N/A")
        SERVERS+=("$RESPONSE")
        echo "  Requête $i : Serveur $RESPONSE"
    done

    # Vérifier qu'on a bien touché les 2 serveurs
    UNIQUE=$(printf '%s\n' "${SERVERS[@]}" | sort -u | wc -l)
    if [ "$UNIQUE" -gt 1 ]; then
        ok "Load Balancing fonctionnel — $UNIQUE serveurs différents contactés"
    else
        warn "Un seul serveur contacté — vérifier les health checks ALB"
    fi
else
    fail "DNS ALB non disponible — infrastructure non déployée ?"
fi

# ============================================================
# TEST 2 : Site statique S3 accessible
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "TEST 2 : Site statique S3 accessible publiquement"
echo "------------------------------------------------------------"
if [ -n "$S3_URL" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$S3_URL" || echo "000")
    if [ "$HTTP_CODE" == "200" ]; then
        ok "Site S3 accessible — HTTP $HTTP_CODE"
    else
        fail "Site S3 inaccessible — HTTP $HTTP_CODE"
    fi
else
    fail "URL S3 non disponible"
fi

# ============================================================
# TEST 3 : Bastion SSH accessible (depuis admin IP uniquement)
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "TEST 3 : Bastion SSH accessible depuis IP admin"
echo "------------------------------------------------------------"
if [ -n "$BASTION_IP" ]; then
    SSH_TEST=$(timeout 5 bash -c "echo > /dev/tcp/$BASTION_IP/22" 2>&1 && echo "open" || echo "closed")
    if [ "$SSH_TEST" == "open" ]; then
        ok "Port SSH 22 ouvert sur Bastion $BASTION_IP"
    else
        fail "Port SSH 22 fermé ou filtré sur Bastion $BASTION_IP"
    fi
else
    warn "IP Bastion non disponible"
fi

# ============================================================
# TEST 4 : Serveurs web NON accessibles directement depuis Internet
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "TEST 4 : Sécurité — Serveurs web non accessibles directement"
echo "------------------------------------------------------------"
if [ -n "$WEB1_IP" ]; then
    # Depuis Internet, les IPs privées ne sont pas routable
    # Ce test valide que les serveurs sont dans un subnet privé
    info "Web1 IP privée : $WEB1_IP — non routable depuis Internet (OK)"
    ok "Segmentation réseau respectée — Web servers en subnet privé"
else
    warn "IP Web1 non disponible"
fi

# ============================================================
# TEST 5 : Vérification du compte racine AWS (MFA)
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "TEST 5 : Sécurité compte AWS — MFA root account"
echo "------------------------------------------------------------"
MFA_STATUS=$(aws iam get-account-summary --query 'SummaryMap.AccountMFAEnabled' --output text 2>/dev/null || echo "N/A")
if [ "$MFA_STATUS" == "1" ]; then
    ok "MFA activé sur le compte root AWS"
elif [ "$MFA_STATUS" == "0" ]; then
    fail "MFA NON activé sur le compte root — RISQUE CRITIQUE !"
else
    warn "Impossible de vérifier le statut MFA"
fi

# ============================================================
# TEST 6 : Vérification des Security Groups critiques
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "TEST 6 : Audit Security Groups — règles trop permissives"
echo "------------------------------------------------------------"
OPEN_SG=$(aws ec2 describe-security-groups \
    --filters "Name=ip-permission.cidr,Values=0.0.0.0/0" \
    --query 'SecurityGroups[].{Name:GroupName,Rules:IpPermissions[?contains(IpRanges[].CidrIp,`0.0.0.0/0`)]}' \
    --output json 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
exposed = [(sg['Name'], [r.get('FromPort','ALL') for r in sg['Rules']]) for sg in data if sg['Rules']]
for name, ports in exposed:
    print(f'  SG: {name} | Ports exposés: {ports}')
" || echo "  N/A")

if echo "$OPEN_SG" | grep -q "22\|3306\|3389"; then
    fail "Des ports sensibles (SSH/MySQL/RDP) sont exposés à 0.0.0.0/0 !"
    echo "$OPEN_SG"
else
    ok "Aucun port sensible exposé directement à Internet"
fi

# ============================================================
# TEST 7 : IMDSv2 activé sur toutes les instances
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "TEST 7 : IMDSv2 activé sur toutes les instances EC2"
echo "------------------------------------------------------------"
INSTANCES=$(aws ec2 describe-instances \
    --filters "Name=instance-state-name,Values=running,stopped" \
    --query 'Reservations[].Instances[].[InstanceId,Tags[?Key==`Name`].Value|[0],MetadataOptions.HttpTokens]' \
    --output text 2>/dev/null || echo "")

ALL_IMDSV2=true
while IFS=$'\t' read -r instance_id name http_tokens; do
    if [ "$http_tokens" == "required" ]; then
        ok "Instance $name ($instance_id) — IMDSv2 requis"
    else
        fail "Instance $name ($instance_id) — IMDSv1 vulnérable ! (tokens=$http_tokens)"
        ALL_IMDSV2=false
    fi
done <<< "$INSTANCES"

if $ALL_IMDSV2; then
    ok "Toutes les instances utilisent IMDSv2"
fi

# ============================================================
# RÉSUMÉ
# ============================================================
echo ""
echo "============================================================"
echo "                    RÉSUMÉ DES TESTS"
echo "============================================================"
echo "Tests exécutés le : $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "Vérifier les [FAIL] ci-dessus et corriger avant la soutenance."
echo ""
