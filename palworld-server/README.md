# Serveur Palworld dédié (Docker)

Guide pour héberger un serveur Palworld pour jouer avec tes amis, en utilisant Docker.
Basé sur l'image communautaire [`thijsvanloef/palworld-server-docker`](https://github.com/thijsvanloef/palworld-server-docker) (la plus utilisée et maintenue).

> ℹ️ Pocketpair ne fournit pas d'image Docker officielle : la doc officielle décrit une installation via SteamCMD. L'image ci-dessus automatise tout ça dans un conteneur, c'est la voie la plus simple pour du Docker.

---

## 1. Prérequis matériel

| Ressource | Minimum | Recommandé (plusieurs joueurs) |
|-----------|---------|--------------------------------|
| CPU       | 4 cœurs | 4+ cœurs                       |
| RAM       | 8 Go    | 16 Go                          |
| Disque    | ~8 Go   | 20+ Go (avec sauvegardes)      |

La RAM est le point critique : elle grimpe avec le nombre de joueurs et l'exploration du monde.

> ⚠️ Évite **Docker Desktop** pour un serveur permanent : les perfs I/O sont moins bonnes et le risque de corruption de sauvegarde augmente. Préfère un vrai Linux (VPS ou machine dédiée) avec Docker Engine.

## 2. Logiciels

- [Docker Engine](https://docs.docker.com/engine/install/) + le plugin `docker compose`

Vérifier :
```bash
docker --version
docker compose version
```

## 3. Ports à ouvrir

Sur ta box/routeur (redirection de ports) **et** sur le pare-feu de la machine :

| Port    | Protocole | Usage                                    |
|---------|-----------|------------------------------------------|
| `8211`  | UDP       | Jeu (obligatoire)                        |
| `27015` | UDP       | Liste des serveurs Steam (recommandé)    |
| `25575` | TCP       | RCON — administration à distance (option)|

## 4. Configuration

1. Ouvre `docker-compose.yml` et modifie **au minimum** :
   - `SERVER_NAME` : le nom affiché
   - `SERVER_PASSWORD` : le mot de passe pour rejoindre
   - `ADMIN_PASSWORD` : mot de passe admin/RCON
   - `PLAYERS` : nombre max de joueurs
   - `TZ` : ton fuseau (déjà réglé sur `Europe/Paris`)

2. `PUID`/`PGID` : garde `1000` sauf si ton utilisateur Linux a d'autres IDs (vérifie avec `id`).

## 5. Démarrage

Depuis ce dossier :
```bash
docker compose up -d
```

Suivre le premier démarrage (téléchargement du serveur, ça prend quelques minutes) :
```bash
docker compose logs -f
```
Le serveur est prêt quand tu vois `Running Palworld dedicated server`.

## 6. Rejoindre le serveur

Dans Palworld → **Rejoindre un multijoueur (serveur dédié)** :
- **Réseau local** : `IP_LOCALE:8211` (ex. `192.168.1.42:8211`)
- **Tes amis (Internet)** : `TON_IP_PUBLIQUE:8211`
  - Trouve ton IP publique : https://ifconfig.me
  - Il faut que la redirection de port UDP 8211 pointe vers la machine du serveur.
- Saisir le `SERVER_PASSWORD` si demandé.

## 7. Commandes utiles

```bash
docker compose stop            # Arrêter (sauvegarde propre)
docker compose start           # Redémarrer
docker compose down            # Stopper + supprimer le conteneur (les données restent dans ./palworld)
docker compose pull && docker compose up -d   # Mettre à jour l'image/serveur
docker compose logs -f         # Voir les logs
```

Sauvegarde manuelle immédiate (si RCON activé) :
```bash
docker compose exec palworld backup
```

## 8. Où sont mes données ?

Tout est dans le dossier `./palworld/` (créé au premier lancement) :
- Le monde et les configs dans `Pal/Saved/`
- Les sauvegardes automatiques dans `Pal/Saved/backups/`

Sauvegarde ce dossier régulièrement (copie externe) pour ne rien perdre.

## 9. Aller plus loin

Toutes les variables d'environnement (règles de jeu, EXP, taux de capture, etc.) sont documentées ici :
https://github.com/thijsvanloef/palworld-server-docker#environment-variables

---

**Sources :**
- Doc officielle Palworld — Requirements : https://docs.palworldgame.com/getting-started/requirements/
- Image Docker communautaire : https://github.com/thijsvanloef/palworld-server-docker
