#!/bin/bash
# ============================================================
# TEST IMDS — IMDSv1 vs IMDSv2 (Étape 9)
# Exploitation SSRF et protection IMDSv2
# IMPORTANT : Exécuter depuis l'intérieur de l'instance EC2
# ============================================================

# IP du service IMDS (toujours 169.254.169.254 sur AWS)
IMDS_IP="169.254.169.254"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[VULN]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo "============================================================"
echo "   TEST IMDS — IMDSv1 vs IMDSv2 — SDV Cloud Security"
echo "============================================================"
echo "Instance : $(hostname)"
echo "Date     : $(date)"
echo ""

# ============================================================
# ÉTAPE 2 : Accéder aux métadonnées (IMDSv1)
# ============================================================
echo "------------------------------------------------------------"
echo "ÉTAPE 2 : Accès aux métadonnées sans token (IMDSv1)"
echo "------------------------------------------------------------"
echo ""
info "Requête IMDSv1 (sans token) : curl http://$IMDS_IP/latest/meta-data/"
METADATA_V1=$(curl -s --max-time 3 "http://$IMDS_IP/latest/meta-data/" 2>/dev/null || echo "REFUSED")

if [ "$METADATA_V1" != "REFUSED" ] && [ -n "$METADATA_V1" ]; then
    fail "IMDSv1 ACCESSIBLE — Vulnérable aux attaques SSRF !"
    echo "  Métadonnées disponibles :"
    echo "$METADATA_V1" | head -20 | sed 's/^/    /'
else
    ok "IMDSv1 bloqué — IMDSv2 correctement configuré"
fi

# ============================================================
# ÉTAPE 3 : Identifier le rôle IAM (IMDSv1)
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "ÉTAPE 3 : Récupérer le rôle IAM via IMDS"
echo "------------------------------------------------------------"
IAM_ROLE_V1=$(curl -s --max-time 3 "http://$IMDS_IP/latest/meta-data/iam/security-credentials/" 2>/dev/null || echo "REFUSED")

if [ "$IAM_ROLE_V1" != "REFUSED" ] && [ -n "$IAM_ROLE_V1" ]; then
    fail "Rôle IAM exposé sans token : $IAM_ROLE_V1"
else
    ok "Rôle IAM non accessible sans token IMDSv2"
fi

# ============================================================
# ÉTAPE 4 : Récupérer les credentials (IMDSv1)
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "ÉTAPE 4 : Tentative de récupération des credentials IAM"
echo "------------------------------------------------------------"
if [ -n "$IAM_ROLE_V1" ] && [ "$IAM_ROLE_V1" != "REFUSED" ]; then
    CREDS=$(curl -s --max-time 3 "http://$IMDS_IP/latest/meta-data/iam/security-credentials/$IAM_ROLE_V1" 2>/dev/null)
    if echo "$CREDS" | grep -q "AccessKeyId"; then
        fail "CREDENTIALS EXPOSÉS via IMDSv1 !"
        echo "  AccessKeyId : $(echo $CREDS | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get(\"AccessKeyId\",\"N/A\")[:10]+\"...\")')"
        fail "Un attaquant SSRF pourrait voler ces credentials !"
    fi
else
    ok "Credentials IAM non accessibles (IMDSv2 protège)"
fi

# ============================================================
# ÉTAPE 5 : Lister les buckets S3 avec les credentials volés
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "ÉTAPE 5 : Test AWS CLI avec credentials IMDS"
echo "------------------------------------------------------------"
info "Test : aws s3 ls (avec le rôle IAM de l'instance)"
S3_LIST=$(aws s3 ls 2>&1)
if echo "$S3_LIST" | grep -q "s3://\|bucket\|2026"; then
    warn "Liste S3 accessible via rôle IAM de l'instance :"
    echo "$S3_LIST" | head -5 | sed 's/^/  /'
else
    ok "Aucun bucket S3 accessible (ou pas de droits S3)"
fi

# ============================================================
# ÉTAPE 6 : Activer IMDSv2
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "ÉTAPE 6 : Test avec IMDSv2 (token requis)"
echo "------------------------------------------------------------"

# Obtenir un token IMDSv2
info "Obtention du token IMDSv2 (TTL 21600s = 6h) :"
TOKEN=$(curl -s -X PUT "http://$IMDS_IP/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" \
    --max-time 3 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
    ok "Token IMDSv2 obtenu : ${TOKEN:0:20}..."

    # Accéder aux métadonnées avec le token
    METADATA_V2=$(curl -s --max-time 3 \
        -H "X-aws-ec2-metadata-token: $TOKEN" \
        "http://$IMDS_IP/latest/meta-data/" 2>/dev/null)

    if [ -n "$METADATA_V2" ]; then
        ok "Métadonnées accessibles AVEC token IMDSv2"
        echo "  Instance ID : $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://$IMDS_IP/latest/meta-data/instance-id)"
        echo "  Région      : $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://$IMDS_IP/latest/meta-data/placement/region)"
    fi
else
    fail "Impossible d'obtenir un token IMDSv2 — IMDS désactivé ?"
fi

# ============================================================
# ÉTAPE 7 : Tester la protection — requête sans token doit échouer
# ============================================================
echo ""
echo "------------------------------------------------------------"
echo "ÉTAPE 7 : Vérification protection IMDSv2"
echo "------------------------------------------------------------"
NO_TOKEN=$(curl -s --max-time 3 "http://$IMDS_IP/latest/meta-data/instance-id" 2>/dev/null || echo "")

if [ -z "$NO_TOKEN" ] || echo "$NO_TOKEN" | grep -q "401\|Unauthorized\|Token\|Required"; then
    ok "Requête sans token REFUSÉE — IMDSv2 protège correctement"
else
    fail "Requête sans token ACCEPTÉE ($NO_TOKEN) — IMDSv1 encore actif !"
    echo ""
    echo "  Pour activer IMDSv2 sur cette instance, exécuter :"
    echo "  aws ec2 modify-instance-metadata-options \\"
    echo "    --instance-id \$(curl -s http://169.254.169.254/latest/meta-data/instance-id) \\"
    echo "    --http-tokens required \\"
    echo "    --http-endpoint enabled"
fi

# ============================================================
# CONCLUSION
# ============================================================
echo ""
echo "============================================================"
echo "                      CONCLUSION"
echo "============================================================"
echo ""
echo "IMDSv1 : Permet d'accéder aux métadonnées sans authentification."
echo "         Vulnérable aux attaques SSRF : un attaquant peut voler"
echo "         les credentials IAM si l'app est vulnérable au SSRF."
echo ""
echo "IMDSv2 : Requiert un token PUT (session-oriented)."
echo "         Les navigateurs et proxies HTTP basiques ne peuvent pas"
echo "         obtenir ce token, bloquant les attaques SSRF."
echo ""
echo "Recommandation : Toujours activer IMDSv2 (http_tokens=required)"
echo "                 sur toutes les instances EC2 en production."
echo ""
