# Projet Technique Cloud Security — SUP DE VINCI

**Sujet** : Configuration et sécurisation du CLOUD (AWS)  
**Deadline** : 25 juin 2026 à 17h — Soutenance le 26 juin  
**Maître d'ouvrage** : Mouhamad El Houssaini

---

## Structure du projet

```
.
├── terraform/          # Infrastructure as Code (AWS)
│   ├── main.tf         # Point d'entrée principal
│   ├── variables.tf    # Variables configurables
│   ├── outputs.tf      # Sorties (IPs, DNS, ARNs)
│   └── modules/
│       ├── vpc/        # VPC, Subnets, IGW, Route Tables, NACLs
│       ├── iam/        # Groupes et policies IAM (ADMIN, DEV, DBA)
│       ├── ec2/        # Instances EC2 (Bastion, Web1, Web2, DB)
│       ├── alb/        # Application Load Balancer
│       ├── s3/         # Bucket S3 site statique
│       ├── lambda/     # Fonction Lambda + trigger S3
│       └── security/   # Security Groups
├── web/
│   ├── server1/        # Page HTML serveur web 1
│   ├── server2/        # Page HTML serveur web 2
│   └── s3-static/      # Site statique S3 (Étape 6)
├── lambda/             # Code Python fonction Lambda (Étape 10)
├── scripts/
│   ├── test_flux.sh    # Tests flux réseau (Étape 5)
│   ├── test_imds.sh    # Test IMDSv1/v2 (Étape 9)
│   └── scoutsuite.sh   # Lancement ScoutSuite (Étape 8)
├── docs/
│   ├── rapport_flux_reseau.md      # Rapport tests flux (Livrable)
│   ├── rapport_vulnerabilites.md   # Rapport vulnérabilités (Étape 7)
│   └── rapport_scoutsuite.md       # Rapport CSPM ScoutSuite (Étape 8)
└── architecture/
    └── architecture_aws.md         # Description détaillée de l'architecture
```

---

## Étapes du projet

| Étape | Description | Statut |
|-------|-------------|--------|
| 1 | Diagramme d'architecture TIER3 | ✅ |
| 2 | Compte AWS + groupes IAM (ADMIN/DEV/DBA) | ✅ Terraform |
| 3 | Réseau : VPC, Subnets, LB (2 AZs) | ✅ Terraform |
| 4 | EC2 : Bastion, Web1, Web2, DB + pages HTML | ✅ Terraform + HTML |
| 5 | Security Groups, ACLs, tests flux | ✅ Terraform + scripts |
| 6 | Site statique S3 | ✅ Terraform + HTML |
| 7 | Scanner vulnérabilités OS (Lynis/Trivy) | ✅ Scripts + rapport |
| 8 | CSPM ScoutSuite | ✅ Script + rapport |
| 9 | IMDSv1 vs IMDSv2 (SSRF) | ✅ Script |
| 10 | S3 + Lambda événementiel | ✅ Code Python |

---

## Déploiement rapide

### Prérequis
- Terraform >= 1.5
- AWS CLI configuré (`aws configure`)
- Compte AWS Free Tier

### Lancer l'infra
```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### Après les tests — éteindre les instances
```bash
# Stopper toutes les EC2 pour éviter les coûts
aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --output text | \
  xargs aws ec2 stop-instances --instance-ids
```

### Détruire l'infra
```bash
cd terraform
terraform destroy
```
