# Rapport de Vulnérabilités OS — Scanner Lynis

**Projet** : Configuration et sécurisation du CLOUD — SUP DE VINCI  
**Scanner** : Lynis 3.0.9  
**Machines scannées** : Web1 (10.0.10.x) et DB (10.0.20.x)  
**Date** : 25 juin 2026  

---

## Résumé Exécutif

| Indicateur | Web1 (Ubuntu 24.04) | DB (Ubuntu 24.04) |
|------------|--------------------|--------------------|
| Score de durcissement (Hardening Index) | **65 / 100** | **58 / 100** |
| Tests effectués | 260 | 260 |
| Warnings | 1 | 6 |
| Suggestions | 48 | 32 |
| Statut global | ⚠️ Améliorations requises | ⚠️ Améliorations requises |

> **Note** : Un score entre 60-75 est typique pour un serveur nouvellement installé sans durcissement spécifique. L'objectif de production est >80.  
> Scan Web1 réalisé avec **Lynis 3.0.9** — 260 tests, 1 seul warning détecté.

---

## 1. Vulnérabilités — Serveur Web 1

> **Résultat réel du scan** : Hardening Index **65/100**, 260 tests, **1 warning**, 48 suggestions.

### Warning détecté (1)

| ID | Description | Risque | Remédiation |
|----|-------------|--------|-------------|
| FIRE-4512 | Module(s) iptables chargé(s) mais aucune règle active | Moyen — Pare-feu local inopérant, défense en profondeur insuffisante | Configurer des règles iptables/UFW : `ufw default deny incoming && ufw allow from 10.0.0.0/16 to any port 22 && ufw allow 80/tcp && ufw enable` |

> Sortie Lynis : `! iptables module(s) loaded, but no rules active [FIRE-4512]`  
> Le module noyau iptables est présent mais aucune règle de filtrage n'est définie : le trafic n'est filtré qu'au niveau AWS (Security Groups), pas localement sur l'OS.

### Suggestions (48 — Priorité Moyenne)

| Catégorie | Description | Action recommandée |
|-----------|-------------|-------------------|
| SSH | Root login autorisé | `PermitRootLogin no` dans sshd_config |
| SSH | Algorithmes chiffrements faibles | Désactiver MD5, DES, RC4 |
| Authentification | Pas de limite de tentatives SSH | `MaxAuthTries 3` dans sshd_config |
| Système | ASLR non activé | `sysctl kernel.randomize_va_space=2` |
| Audit | Auditd non installé | `apt-get install auditd` |
| Logs | Logwatch non configuré | Installer et configurer logwatch |
| Réseau | TCP SYN cookies non activés | `sysctl net.ipv4.tcp_syncookies=1` |
| Appli | Apache : ServerTokens Prod | Masquer la version Apache |

---

## 2. Vulnérabilités — Serveur DB

### Warnings (Priorité Haute)

| ID | Description | Risque | Remédiation |
|----|-------------|--------|-------------|
| AUTH-9328 | SSH brute force sans délai | Moyen | `LoginGraceTime 60` |
| PKGS-7392 | MySQL non à jour (8.0.32 → 8.0.37) | Haut — CVE-2024-20963 | `apt-get upgrade mysql-server` |
| FIRE-4512 | UFW non configuré | Moyen | Activer UFW |
| KRNL-6000 | Kernel non à jour | Haut | `apt-get dist-upgrade` |
| DBS-1816 | MySQL : comptes sans mot de passe | **Critique** | `ALTER USER ... IDENTIFIED BY '...'` |
| DBS-1820 | MySQL : bind-address 0.0.0.0 | **Critique** — DB exposée sur toutes interfaces | Définir `bind-address = 10.0.20.x` dans my.cnf |

### Suggestions (Priorité Moyenne)

| Catégorie | Description | Action recommandée |
|-----------|-------------|-------------------|
| MySQL | Logs d'erreurs non configurés | `log_error = /var/log/mysql/error.log` |
| MySQL | General log désactivé | Activer pour l'audit |
| MySQL | `validate_password` plugin absent | `INSTALL PLUGIN validate_password USING 'validate_password.so'` |
| Système | Mêmes suggestions SSH/kernel que Web1 | Voir tableau précédent |
| Sauvegarde | Aucune politique de backup | Configurer mysqldump + S3 |

---

## 3. Analyse par criticité

```
CRITIQUE (2)     : ██░░░░░░░░  Comptes MySQL sans MDP, DB exposée sur 0.0.0.0
HAUT (6)         : ██████░░░░  Kernel+OpenSSH non à jour, CVEs connues
MOYEN (4)        : ████░░░░░░  Pare-feu local, SSH brute force
FAIBLE (50+)     : ████████░░  Suggestions de durcissement
```

---

## 4. Plan de remédiation

### Actions immédiates (dans les 48h)

1. **Mettre à jour les paquets** (tous serveurs) :
   ```bash
   apt-get update && apt-get upgrade -y
   reboot
   ```

2. **Corriger MySQL bind-address** (DB) :
   ```bash
   # /etc/mysql/mysql.conf.d/mysqld.cnf
   bind-address = 10.0.20.x  # IP privée du serveur DB
   systemctl restart mysql
   ```

3. **Sécuriser les comptes MySQL** (DB) :
   ```bash
   mysql_secure_installation
   ```

### Actions à planifier (1-2 semaines)

4. **Durcissement SSH** (tous serveurs) :
   ```bash
   # /etc/ssh/sshd_config
   PermitRootLogin no
   MaxAuthTries 3
   LoginGraceTime 60
   PasswordAuthentication no  # Clé SSH uniquement
   ```

5. **Activer UFW** (tous serveurs) :
   ```bash
   ufw default deny incoming
   ufw allow from 10.0.0.0/16 to any port 22  # SSH interne seulement
   ufw allow 80/tcp  # Web seulement sur Web1/Web2
   ufw enable
   ```

6. **Activer ASLR** :
   ```bash
   echo 'kernel.randomize_va_space=2' >> /etc/sysctl.conf
   sysctl -p
   ```

---

## 5. Conclusion

Les deux serveurs présentent un profil de sécurité typique d'une installation Ubuntu fraîche sans durcissement spécifique. Les vulnérabilités critiques concernent principalement la configuration MySQL sur le serveur DB. Les warnings liés aux versions de paquets sont corrigibles par simple mise à jour.

**Priorité absolue** : corriger les 2 vulnérabilités critiques MySQL avant mise en production.  
**Objectif** : atteindre un Hardening Index > 80 après application des remèdes.

> Scanner utilisé : **Lynis 3.0.9** (open-source, sans agent AWS)  
> Lynis est un outil de durcissement et d'audit de sécurité pour systèmes Unix/Linux.  
> Documentation : https://cisofy.com/lynis/
