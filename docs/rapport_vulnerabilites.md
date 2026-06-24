# Rapport de Vulnérabilités OS — Scanner Lynis

**Projet** : Configuration et sécurisation du CLOUD — SUP DE VINCI  
**Scanner** : Lynis 3.0.9  
**Machines scannées** : Web1 (10.0.10.x) et DB (10.0.20.x)  
**Date** : 25 juin 2026  

---

## Résumé Exécutif

| Indicateur | Web1 (Ubuntu 24.04) | DB (Ubuntu 24.04) |
|------------|--------------------|--------------------|
| Score de durcissement (Hardening Index) | **65 / 100** | **64 / 100** |
| Tests effectués | 260 | 260 |
| Warnings | 1 | 1 |
| Suggestions | 48 | 30+ |
| Statut global | ⚠️ Améliorations requises | ⚠️ Améliorations requises |

> **Note** : Un score entre 60-75 est typique pour un serveur nouvellement installé sans durcissement spécifique. L'objectif de production est >80.  
> Scans réalisés avec **Lynis 3.0.9** — 260 tests par machine.

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

> **Résultat réel du scan** : Hardening Index **64/100**, 260 tests, **1 warning**, 30+ suggestions.  
> IP interne : 10.0.20.222 (subnet privé DB, aucun accès internet direct).

### Warning détecté (1)

| ID | Description | Risque | Remédiation |
|----|-------------|--------|-------------|
| FIRE-4512 | Module(s) iptables chargé(s) mais aucune règle active | Moyen — Pare-feu local inopérant | `ufw default deny incoming && ufw allow from 10.0.0.0/16 to any port 22 && ufw allow from 10.0.10.0/24 to any port 3306 && ufw enable` |

> Même finding que Web1 : filtrage réseau assuré uniquement par les Security Groups AWS, pas au niveau OS.

### Suggestions notables (Priorité Moyenne)

| ID | Catégorie | Description | Action recommandée |
|----|-----------|-------------|-------------------|
| DEB-0880 | Sécurité | fail2ban non installé | `apt-get install fail2ban` |
| AUTH-9262 | Auth | Pas de plugin de complexité de mot de passe | Installer `libpam-pwquality` |
| AUTH-9286 | Auth | Pas d'âge min/max de mot de passe | Configurer `/etc/login.defs` |
| SSH-7408 | SSH | AllowTcpForwarding activé | Mettre `AllowTcpForwarding no` dans sshd_config |
| SSH-7408 | SSH | LogLevel INFO (insuffisant) | Mettre `LogLevel VERBOSE` |
| BOOT-5122 | Démarrage | Pas de mot de passe GRUB | Configurer password GRUB |
| KRNL-5820 | Kernel | Core dumps non désactivés | Ajouter `* hard core 0` dans `/etc/security/limits.conf` |
| NETW-3200 | Réseau | Protocoles inutiles actifs (dccp, sctp, rds, tipc) | Blacklister dans `/etc/modprobe.d/` |

---

## 3. Analyse par criticité

```
CRITIQUE (0)     :             Aucune vulnérabilité critique détectée
HAUT (0)         :             Aucun warning haute sévérité
MOYEN (2)        : ██░░░░░░░░  FIRE-4512 sur Web1 et DB (iptables sans règles)
FAIBLE (78+)     : ████████░░  Suggestions de durcissement (48 Web1 + 30+ DB)
```

> **Résultat positif** : les scans ne révèlent aucune vulnérabilité critique, ce qui s'explique par l'architecture AWS (Security Groups assurant le filtrage réseau externe). Le seul warning commun aux deux machines est l'absence de règles iptables locales.

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
