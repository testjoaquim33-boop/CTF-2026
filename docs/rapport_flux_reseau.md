# Rapport de Tests de Flux Réseau et Applicatifs

**Projet** : Configuration et sécurisation du CLOUD — SUP DE VINCI  
**Date** : 25 juin 2026  
**Infrastructure** : AWS Free Tier — Architecture TIER3  

---

## 1. Contexte

Ce rapport présente les tests de flux réseau et applicatifs réalisés sur l'architecture TIER3 déployée dans AWS. L'objectif est de valider que :
- L'application est accessible depuis Internet via le Load Balancer
- Les serveurs backend ne sont pas directement exposés à Internet
- Les Security Groups et ACLs filtrent correctement le trafic
- L'accès administrateur passe obligatoirement par le Bastion

---

## 2. Architecture testée

```
Internet
    │
    ▼
[ALB — subnet public, 2 AZs]
    │  (HTTP:80 seulement)
    ▼
[Web1 (eu-west-1a)]   [Web2 (eu-west-1b)]
    │  subnet privé app   │
    └──────────┬───────────┘
               │ (MySQL:3306 seulement)
               ▼
        [DB — subnet privé db]

[Bastion — subnet public]
    │  (SSH:22 → IP admin uniquement)
    └──→ Web1, Web2, DB (SSH:22 interne)
```

### Composants déployés

| Composant | Subnet | IP | Zone |
|-----------|--------|----|------|
| Application Load Balancer | Public | DNS public | eu-west-1a + 1b |
| Bastion Host | Public (10.0.1.0/24) | IP publique dynamique | eu-west-1a |
| Serveur Web 1 | Privé App (10.0.10.0/24) | 10.0.10.x | eu-west-1a |
| Serveur Web 2 | Privé App (10.0.11.0/24) | 10.0.11.x | eu-west-1b |
| Serveur DB | Privé DB (10.0.20.0/24) | 10.0.20.x | eu-west-1a |

---

## 3. Tests de flux autorisés

### Test 1 : Application Web via Load Balancer

| Test | Source | Destination | Port | Résultat |
|------|--------|-------------|------|----------|
| HTTP vers ALB | Internet (0.0.0.0/0) | ALB DNS | 80/TCP | ✅ PASS |
| Load Balancing Web1 | ALB | Web1 (10.0.10.x) | 80/TCP | ✅ PASS |
| Load Balancing Web2 | ALB | Web2 (10.0.11.x) | 80/TCP | ✅ PASS |
| Round-robin LB | 6 requêtes HTTP | ALB → Web1/Web2 | 80/TCP | ✅ PASS |

**Vérification** : La page HTML de chaque serveur affiche son IP privée. En effectuant plusieurs requêtes successives sur le DNS du Load Balancer, l'IP alternait entre les deux serveurs, confirmant le load balancing.

```bash
# Commandes de test utilisées
curl -s http://sdv-cloud-alb-xxxx.eu-west-1.elb.amazonaws.com/
# Résultat alternant : IP 10.0.10.x et 10.0.11.x
```

### Test 2 : Site statique S3

| Test | Source | Destination | Résultat |
|------|--------|-------------|----------|
| HTTP vers S3 | Internet | http://sdv-cloud-static-site-2026.s3-website-eu-west-1.amazonaws.com | ✅ PASS |
| Page HTML | Navigateur | index.html + logo.png | ✅ PASS |

### Test 3 : Accès SSH via Bastion

| Test | Source | Destination | Port | Résultat |
|------|--------|-------------|------|----------|
| SSH Bastion | IP admin | Bastion IP publique | 22/TCP | ✅ PASS |
| SSH Web1 via Bastion | Bastion | 10.0.10.x | 22/TCP | ✅ PASS |
| SSH Web2 via Bastion | Bastion | 10.0.11.x | 22/TCP | ✅ PASS |
| SSH DB via Bastion | Bastion | 10.0.20.x | 22/TCP | ✅ PASS |

**Commandes utilisées** :
```bash
# Depuis la machine admin
ssh -i sdv-cloud-key.pem -A ubuntu@<BASTION_IP>

# Depuis le bastion (Agent Forwarding)
ssh ubuntu@10.0.10.x  # Web1
ssh ubuntu@10.0.11.x  # Web2
ssh ubuntu@10.0.20.x  # DB
```

---

## 4. Tests de flux bloqués (sécurité)

### Test 4 : Accès direct aux serveurs Web depuis Internet

| Test | Source | Destination | Port | Résultat |
|------|--------|-------------|------|----------|
| HTTP direct Web1 | Internet | 10.0.10.x (IP privée) | 80/TCP | ✅ BLOQUÉ |
| HTTP direct Web2 | Internet | 10.0.11.x (IP privée) | 80/TCP | ✅ BLOQUÉ |
| SSH direct Web1 | Internet | 10.0.10.x | 22/TCP | ✅ BLOQUÉ |

**Raison** : Les serveurs web sont dans des subnets privés (pas d'IP publique, pas de route vers IGW). Seul le Load Balancer est dans le subnet public.

### Test 5 : Accès SSH au Bastion depuis une IP non autorisée

| Test | Source | Destination | Port | Résultat |
|------|--------|-------------|------|----------|
| SSH depuis IP inconnue | 8.8.8.8 (simulé) | Bastion | 22/TCP | ✅ BLOQUÉ |

**Raison** : Le Security Group du Bastion n'autorise le SSH que depuis l'IP admin définie (`var.admin_ip_cidr`).

### Test 6 : Accès MySQL depuis Internet

| Test | Source | Destination | Port | Résultat |
|------|--------|-------------|------|----------|
| MySQL direct DB | Internet | 10.0.20.x | 3306/TCP | ✅ BLOQUÉ |
| MySQL depuis Web1 | Web1 (10.0.10.x) | DB (10.0.20.x) | 3306/TCP | ✅ PASS |
| MySQL depuis Bastion | Bastion | DB | 3306/TCP | ✅ BLOQUÉ |

**Raison** : Le SG de la DB n'autorise MySQL que depuis le SG des serveurs Web.

### Test 7 : IMDSv2 — Protection SSRF

| Test | Méthode | Résultat |
|------|---------|----------|
| GET métadonnées sans token | `curl http://169.254.169.254/latest/meta-data/` | ✅ BLOQUÉ (401) |
| GET métadonnées avec token | `curl -H "X-aws-ec2-metadata-token: <token>" ...` | ✅ PASS |

---

## 5. Validation des Security Groups

### SG ALB (sg-alb)
| Direction | Port | Protocole | Source/Dest | Justification |
|-----------|------|-----------|-------------|---------------|
| Entrée | 80 | TCP | 0.0.0.0/0 | Trafic HTTP public |
| Entrée | 443 | TCP | 0.0.0.0/0 | Trafic HTTPS public |
| Sortie | 80 | TCP | VPC (10.0.0.0/16) | Vers les serveurs web |

### SG Bastion (sg-bastion)
| Direction | Port | Protocole | Source/Dest | Justification |
|-----------|------|-----------|-------------|---------------|
| Entrée | 22 | TCP | IP admin uniquement | SSH restreint |
| Sortie | 22 | TCP | VPC (10.0.0.0/16) | Forward SSH interne |

### SG Web (sg-web)
| Direction | Port | Protocole | Source/Dest | Justification |
|-----------|------|-----------|-------------|---------------|
| Entrée | 80 | TCP | sg-alb | HTTP depuis ALB seulement |
| Entrée | 22 | TCP | sg-bastion | SSH depuis Bastion seulement |
| Sortie | 3306 | TCP | VPC | Vers DB |

### SG DB (sg-db)
| Direction | Port | Protocole | Source/Dest | Justification |
|-----------|------|-----------|-------------|---------------|
| Entrée | 3306 | TCP | sg-web | MySQL depuis Web seulement |
| Entrée | 22 | TCP | sg-bastion | SSH depuis Bastion seulement |
| Sortie | ALL | ALL | VPC | Réponses internes |

---

## 6. Validation des Network ACLs

| NACL | Subnet | Règles entrée | Règles sortie |
|------|--------|---------------|---------------|
| nacl-public | Subnets publics | HTTP(80), HTTPS(443), SSH(22), éphémères | Tout |
| nacl-private-app | Subnets app | HTTP(80), SSH(22), éphémères depuis VPC | Vers VPC |
| nacl-private-db | Subnets DB | MySQL(3306) depuis app, SSH(22) depuis public | Vers VPC |

---

## 7. Test d'accès à distance (Remote Access)

**Procédure d'accès sécurisé via Bastion** :

1. Démarrer le Bastion depuis la console AWS
2. Connexion SSH au Bastion :
   ```bash
   ssh -i sdv-cloud-key.pem ubuntu@<BASTION_IP>
   ```
3. Depuis le Bastion, connexion aux serveurs privés :
   ```bash
   ssh ubuntu@<WEB1_PRIVATE_IP>   # Serveur Web 1
   ssh ubuntu@<DB_PRIVATE_IP>     # Serveur DB
   ```

**Résultat** : Accès réussi aux serveurs privés uniquement via le Bastion. L'accès direct depuis Internet est impossible (IP privées, pas d'IP publique assignée).

---

## 8. Conclusion

L'architecture TIER3 déployée respecte les principes de segmentation réseau :

- **Tier 1 (Public)** : Seul le Load Balancer et le Bastion sont exposés à Internet
- **Tier 2 (Privé App)** : Les serveurs web sont isolés, accessibles uniquement via ALB (HTTP) ou Bastion (SSH)
- **Tier 3 (Privé DB)** : La base de données est totalement isolée d'Internet, accessible uniquement depuis les serveurs web (MySQL) ou le Bastion (SSH)

Le load balancing entre les 2 AZs assure la **résilience** : si eu-west-1a tombe, eu-west-1b continue de servir le trafic.

**Tous les flux testés sont conformes à l'architecture définie.**
