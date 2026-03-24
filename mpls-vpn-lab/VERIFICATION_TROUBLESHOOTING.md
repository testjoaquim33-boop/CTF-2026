# Commandes de vérification et troubleshooting

## Étape 1 : Vérifier OSPF dans le backbone

```
! Sur chaque routeur core (PE1, PE2, PE3, P1, P2)
show ip ospf neighbor
show ip ospf interface brief
show ip route ospf
```

**Attendu** : Chaque routeur doit voir ses voisins OSPF en état FULL.

**Erreurs classiques** :
- Oubli de `no shutdown` sur les interfaces serial
- Mismatch de subnet mask entre voisins
- Oubli de `network` dans OSPF ou mauvais wildcard mask
- Interface pas dans area 0

## Étape 2 : Vérifier MPLS/LDP

```
! Sur chaque routeur core
show mpls ldp neighbor
show mpls ldp bindings
show mpls forwarding-table
show mpls interfaces
```

**Attendu** :
- LDP neighbors établis entre tous les routeurs adjacents
- Labels assignés pour chaque préfixe /32 (loopbacks)
- `mpls ip` visible sur chaque interface core

**Erreurs classiques** :
- Oubli de `ip cef` (CEF requis pour MPLS)
- Oubli de `mpls ip` sur une interface
- Oubli de `mpls ldp router-id Loopback0 force`
- Loopback non annoncée dans OSPF

## Étape 3 : Vérifier MP-BGP VPNv4

```
! Sur PE1 et PE2
show bgp vpnv4 unicast all summary
show bgp vpnv4 unicast all
show ip bgp vpnv4 all
```

**Attendu** :
- Voisinage BGP entre PE1 (172.16.1.1) et PE2 (172.16.1.2) en état Established
- Routes VPN échangées (192.168.1.0/24 et 192.168.2.0/24)

**Erreurs classiques** :
- `update-source Loopback0` manquant → BGP n'utilise pas la bonne source
- `send-community extended` manquant → Route-Targets non transmis
- `no bgp default ipv4-unicast` oublié → BGP essaie d'activer IPv4 unicast
- Loopback pas joignable via OSPF → session BGP ne monte pas

## Étape 4 : Vérifier VRF et routage VPN

```
! Sur PE1 et PE2
show ip vrf
show ip vrf interfaces
show ip route vrf CLIENT_A
show ip route vrf CLIENT_B
show ip bgp vpnv4 vrf CLIENT_A
show ip bgp vpnv4 vrf CLIENT_B
```

**Attendu** :
- VRF CLIENT_A et CLIENT_B créées avec les bons RD/RT
- Interfaces CE assignées aux bonnes VRF
- Table de routage VRF contient routes locales + routes distantes via BGP

**Erreurs classiques** :
- Oubli de `ip vrf forwarding` AVANT `ip address` (l'IP est supprimée quand on assigne la VRF)
- RD ou RT mismatch entre PE1 et PE2
- `redistribute static` manquant dans `address-family ipv4 vrf`

## Étape 5 : Vérifier connectivité MPLS VPN (CE à CE)

```
! Depuis PE1
ping vrf CLIENT_A 192.168.2.0
ping vrf CLIENT_A 10.1.2.1

! Depuis A_CE1
ping 10.1.1.2
ping 192.168.2.10

! Depuis PC1 (VPCS)
ping 192.168.2.10

! Traceroute pour voir le chemin MPLS
traceroute vrf CLIENT_A 192.168.2.10 source 10.1.1.2
```

## Étape 6 : Vérifier DMVPN

```
! Sur PE3 (Hub)
show dmvpn
show ip nhrp
show ip nhrp multicast
show interface Tunnel0

! Sur RT1 et RT2 (Spokes)
show dmvpn
show ip nhrp
show ip nhrp nhs
ping 10.0.0.1    ! Ping le hub
ping 10.0.0.3    ! Ping l'autre spoke (depuis RT1)
```

**Attendu** :
- DMVPN state: Up
- NHRP entries pour le hub et les spokes
- Ping fonctionnel entre les endpoints du tunnel

**Erreurs classiques** :
- `tunnel key` mismatch entre hub et spokes
- `ip nhrp network-id` mismatch
- Underlay non routable (RT1 ne peut pas joindre 90.0.0.10)
- Oubli des routes statiques underlay vers A_CE4
- `tunnel mode gre multipoint` manquant

## Étape 7 : Vérifier EIGRP sur DMVPN

```
! Sur PE3, RT1, RT2
show ip eigrp neighbors
show ip route eigrp
show ip eigrp topology
```

**Attendu** :
- PE3 voit RT1 et RT2 comme voisins EIGRP
- RT1 apprend 192.168.2.0/24 via le tunnel
- RT2 apprend 192.168.1.0/24 via le tunnel

**Erreurs classiques** :
- `no ip split-horizon eigrp 100` manquant sur le hub → routes non relayées
- `no auto-summary` manquant → routes summarisées incorrectement
- `network` statement incorrect

## Étape 8 : Vérifier HSRP

```
! Sur A_CE1 et RT1_BACKUP
show standby
show standby brief

! Sur A_CE2 et RT2_BACKUP
show standby
show standby brief
```

**Attendu** :
- A_CE1 = Active (priorité 110), RT1 = Standby (priorité 100)
- A_CE2 = Active (priorité 110), RT2 = Standby (priorité 100)
- VIP 192.168.1.1 (gauche) et 192.168.2.1 (droite)

**Erreurs classiques** :
- HSRP group mismatch (doit être identique entre les deux routeurs)
- `preempt` manquant → le routeur ne reprend pas la main après récupération
- `track` configuré sur une interface qui n'existe pas
- VIP identique à une IP réelle d'un routeur

## Étape 9 : Test de failover HSRP

```
! Simuler une panne du lien primaire sur A_CE1
! Sur A_CE1 :
interface Serial2/0
 shutdown

! Vérifier que RT1 devient Active
! Sur RT1 :
show standby brief
! Priority de A_CE1 devrait passer de 110 à 90 (track décrémente de 20)
! RT1 (priority 100) prend le relais

! Tester la connectivité backup
! Depuis PC1 :
ping 192.168.2.10
traceroute 192.168.2.10
! Le trafic devrait passer par RT1 → DMVPN → PE3 → RT2

! Restaurer le lien primaire
! Sur A_CE1 :
interface Serial2/0
 no shutdown
! A_CE1 reprend le rôle Active grâce au preempt
```

## Étape 10 : Vérification complète end-to-end

```
! Depuis PC1 (VPCS)
ping 192.168.2.10
trace 192.168.2.10

! Résultat attendu (chemin primaire via MPLS) :
! PC1 → 192.168.1.1 (VIP) → 10.1.1.2 (PE1) → [MPLS labels] → 10.1.2.1 (A_CE2) → 192.168.2.10 (PC3)

! Depuis PC2 (VPCS) - Client B
ping 192.168.2.10
trace 192.168.2.10
```

## Troubleshooting : Si ça ne ping pas

### 1. Vérifier couche par couche (bottom-up)

```
! Couche 1 : Interfaces up/up ?
show ip interface brief

! Couche 2 : ARP résolu ?
show arp

! Couche 3 : Routes présentes ?
show ip route
show ip route vrf CLIENT_A (sur PE)
```

### 2. Tester hop par hop

```
! PC1 → Gateway HSRP
ping 192.168.1.1

! Gateway → PE1
ping 10.1.1.2 (depuis A_CE1)

! PE1 → PE2 (dans la VRF)
ping vrf CLIENT_A 10.1.2.1 source 10.1.1.2

! PE2 → A_CE2
ping vrf CLIENT_A 192.168.2.2 source 10.1.2.2

! A_CE2 → PC3
ping 192.168.2.10 (depuis A_CE2)
```

### 3. Debug MPLS

```
show mpls ldp neighbor
show mpls forwarding-table
debug mpls ldp events
debug mpls packets
```

### 4. Debug BGP VPN

```
show bgp vpnv4 unicast all
debug ip bgp updates
debug ip bgp vpnv4 unicast updates
```

### 5. Debug DMVPN/NHRP

```
debug dmvpn all
debug nhrp
show dmvpn detail
show ip nhrp detail
```

### 6. Debug HSRP

```
debug standby
debug standby events
debug standby errors
```

## Checklist rapide si PC1 ne ping pas PC3

| # | Vérification | Commande | OK ? |
|---|-------------|----------|------|
| 1 | PC1 ping gateway 192.168.1.1 | `ping 192.168.1.1` (VPCS) | |
| 2 | HSRP active sur A_CE1 | `show standby brief` | |
| 3 | A_CE1 ping PE1 (10.1.1.2) | `ping 10.1.1.2` | |
| 4 | PE1 a route VRF vers 192.168.2.0 | `show ip route vrf CLIENT_A` | |
| 5 | BGP session PE1↔PE2 Up | `show bgp vpnv4 unicast all summary` | |
| 6 | MPLS labels OK | `show mpls forwarding-table` | |
| 7 | PE2 a route VRF vers 192.168.1.0 | `show ip route vrf CLIENT_A` | |
| 8 | PE2 ping A_CE2 (10.1.2.1) | `ping vrf CLIENT_A 10.1.2.1` | |
| 9 | A_CE2 ping PC3 (192.168.2.10) | `ping 192.168.2.10` | |
| 10 | PC3 a la bonne gateway | `show ip` (VPCS) | |
