# Rapport CSPM — ScoutSuite

**Projet** : Configuration et sécurisation du CLOUD — SUP DE VINCI  
**Outil** : ScoutSuite (open-source, NCC Group)  
**Environnement scanné** : AWS Free Tier — Compte SDV Cloud  
**Date** : 25 juin 2026  

---

## 1. Présentation de ScoutSuite

**ScoutSuite** est un outil de CSPM (Cloud Security Posture Management) open-source qui analyse la configuration d'un environnement Cloud et identifie les mauvaises configurations de sécurité.

Il fonctionne en interrogeant les APIs AWS (sans agent) et génère un rapport HTML interactif classant les findings par service et par sévérité.

**Sévérités utilisées** :
- 🔴 **Danger** : Risque critique, à corriger immédiatement
- 🟠 **Warning** : Risque moyen, à corriger rapidement
- 🔵 **Good** : Bonne pratique respectée

---

## 2. Résumé des résultats

| Service AWS | Danger | Warning | Good | Statut |
|-------------|--------|---------|------|--------|
| IAM | 1 | 3 | 8 | ⚠️ |
| EC2 | 2 | 4 | 6 | ⚠️ |
| S3 | 0 | 1 | 5 | ✅ |
| VPC | 0 | 2 | 7 | ✅ |
| CloudTrail | 1 | 0 | 0 | 🔴 |
| CloudWatch | 0 | 2 | 3 | ⚠️ |
| Lambda | 0 | 1 | 3 | ✅ |
| **TOTAL** | **4** | **13** | **32** | ⚠️ |

---

## 3. Findings Danger (Critiques)

### 3.1 IAM — Utilisateur root avec accès programmatique

**Règle** : `iam-root-account-access-keys`  
**Sévérité** : 🔴 Danger  
**Description** : Des access keys sont associées au compte root AWS. Le compte root ne devrait jamais avoir d'access keys programmatiques.

**Risque** : Si les clés sont compromises, un attaquant a un accès total et irréversible au compte AWS.

**Remédiation** :
```
Console AWS → IAM → Security Credentials (root) → Access Keys → Delete
```

---

### 3.2 EC2 — Instances avec IMDSv1 activé

**Règle** : `ec2-instance-metadata-service-v1-enabled`  
**Sévérité** : 🔴 Danger  
**Description** : Une instance EC2 accepte les requêtes IMDS sans token (IMDSv1).  

**Risque** : Vulnérable aux attaques SSRF qui peuvent voler les credentials IAM temporaires de l'instance.

**Remédiation** :
```bash
aws ec2 modify-instance-metadata-options \
  --instance-id <INSTANCE_ID> \
  --http-tokens required \
  --http-endpoint enabled
```

> Note : Ce finding a été corrigé dans notre Terraform (tous les `metadata_options { http_tokens = "required" }`).

---

### 3.3 EC2 — Security Group exposant SSH à 0.0.0.0/0

**Règle** : `ec2-security-group-opens-ssh-to-all`  
**Sévérité** : 🔴 Danger  
**Description** : Un Security Group autorise le port 22 (SSH) depuis toute adresse Internet.  

**Risque** : Exposition aux attaques brute force SSH depuis n'importe quelle adresse IP.

**Remédiation** : Restreindre la règle SSH à l'IP admin uniquement.
```
Console AWS → EC2 → Security Groups → sg-bastion → Edit Inbound Rules
Source: <VOTRE_IP>/32 au lieu de 0.0.0.0/0
```

> Note : Corrigé dans notre Terraform via `var.admin_ip_cidr`.

---

### 3.4 CloudTrail — Non activé

**Règle** : `cloudtrail-no-logging`  
**Sévérité** : 🔴 Danger  
**Description** : CloudTrail n'est pas activé dans cette région. Aucun audit des actions API n'est effectué.

**Risque** : Impossible de détecter ou d'investiguer une compromission. Pas de traçabilité des actions.

**Remédiation** :
```
Console AWS → CloudTrail → Create Trail
- Name: sdv-cloud-trail
- S3 bucket: créer un bucket dédié aux logs
- Toutes les régions: Yes
- Management events: Read + Write
```

---

## 4. Findings Warning (Modérés)

### 4.1 IAM

| Finding | Description | Remédiation |
|---------|-------------|-------------|
| `iam-user-no-mfa` | 2 utilisateurs IAM sans MFA activé | Activer MFA sur tous les comptes IAM humains |
| `iam-password-policy-weak` | Politique de mot de passe AWS faible (longueur min < 14) | IAM → Account Settings → Min 14 chars, complexité requise |
| `iam-user-with-active-keys-not-rotated` | Access keys non tournées depuis > 90j | Rotation des clés via IAM |

### 4.2 EC2

| Finding | Description | Remédiation |
|---------|-------------|-------------|
| `ec2-ebs-volume-not-encrypted` | Volume EBS non chiffré | Chiffrer via `encrypted = true` dans Terraform |
| `ec2-instance-not-using-imdsv2` | Instance avec IMDSv1 | Voir finding critique 3.2 |
| `ec2-security-group-unrestricted-egress` | SG avec sortie 0.0.0.0/0 | Restreindre les règles egress |
| `ec2-public-instance-in-private-subnet` | Instance avec IP publique dans subnet non dédié | Vérifier les associations subnet/instance |

### 4.3 S3

| Finding | Description | Remédiation |
|---------|-------------|-------------|
| `s3-bucket-no-logging` | Accès logs non activés sur le bucket statique | Activer Server Access Logging |

### 4.4 VPC

| Finding | Description | Remédiation |
|---------|-------------|-------------|
| `vpc-flow-logs-not-enabled` | VPC Flow Logs non activés | Activer les Flow Logs pour la détection d'intrusion |
| `vpc-default-security-group-in-use` | Security Group default utilisé par une ressource | Ne jamais utiliser le SG default |

### 4.5 CloudWatch

| Finding | Description | Remédiation |
|---------|-------------|-------------|
| `cloudwatch-no-alarm-unauthorized-api-calls` | Pas d'alerte sur les appels API non autorisés | Créer une metric alarm CloudWatch |
| `cloudwatch-no-alarm-root-account-usage` | Pas d'alerte sur l'utilisation du compte root | Créer une alerte sur les events root |

### 4.6 Lambda

| Finding | Description | Remédiation |
|---------|-------------|-------------|
| `lambda-function-no-xray-tracing` | X-Ray tracing non activé | Activer X-Ray pour le monitoring Lambda |

---

## 5. Bonne pratiques respectées (Good)

✅ VPC dédié créé (pas d'utilisation du VPC default)  
✅ Subnets publics et privés segmentés  
✅ Security Groups avec règles strictes entre les tiers  
✅ Network ACLs configurées  
✅ Bucket S3 statique avec Public Access Block correctement configuré  
✅ Bucket S3 Lambda entièrement privé  
✅ Chiffrement SSE-AES256 sur les buckets S3  
✅ Versioning S3 activé  
✅ Groupes IAM avec Least Privilege (ADMIN/DEV/DBA)  
✅ Rôle IAM EC2 sans permissions excessives  
✅ Lambda avec rôle IAM dédié et minimal  

---

## 6. Actions de correction prioritaires

| Priorité | Action | Impact |
|----------|--------|--------|
| 🔴 1 | Supprimer les access keys root | Critique — Empêche compromission totale |
| 🔴 2 | Activer CloudTrail | Critique — Traçabilité et conformité |
| 🔴 3 | Corriger SSH 0.0.0.0/0 sur le bastion | Critique — Stopper exposition SSH |
| 🟠 4 | Activer MFA sur tous les utilisateurs IAM | Haut |
| 🟠 5 | Activer VPC Flow Logs | Haut — Détection d'intrusion |
| 🟠 6 | Renforcer la politique de mots de passe IAM | Moyen |
| 🟠 7 | Chiffrer tous les volumes EBS | Moyen |

---

## 7. Comment lire le rapport ScoutSuite

Le rapport HTML généré par ScoutSuite présente :

1. **Dashboard** : Vue d'ensemble avec compteurs par sévérité et par service
2. **Services** : Navigation par service AWS (IAM, EC2, S3, VPC...)
3. **Rules** : Chaque règle de sécurité avec son statut et les ressources affectées
4. **Ressources** : Détail de chaque ressource AWS et ses configurations

Pour chaque finding, ScoutSuite indique :
- La règle déclenchée (ex: `ec2-security-group-opens-ssh-to-all`)
- Le niveau de risque (danger/warning/good)
- La liste des ressources concernées avec leur ID AWS
- Une description du risque

---

## 8. Conclusion

Le scan ScoutSuite a identifié **4 findings critiques** et **13 warnings** sur l'environnement AWS. 

Les points les plus importants à corriger sont :
1. **Désactiver les access keys root** (risque d'accès total)
2. **Activer CloudTrail** (traçabilité obligatoire en production)
3. **Restreindre l'accès SSH** au Bastion à l'IP admin uniquement

L'architecture respecte les bonnes pratiques fondamentales (VPC dédié, segmentation TIER3, IAM Least Privilege), mais nécessite des ajustements de configuration avant une mise en production réelle.

> **Outil** : ScoutSuite est open-source, disponible sur GitHub : https://github.com/nccgroup/ScoutSuite  
> Il ne nécessite pas d'agent sur les machines et fonctionne uniquement via les APIs AWS.
