# Lab MPLS VPN + DMVPN + HSRP - Plan d'implémentation

## Topologie logique

```
                        DMVPN (Tunnel GRE mGRE)
          RT1 ======= A_CE4 ======= RT2
          |  \__________|__________/  |
          |        (PE3 = Hub)        |
  [HSRP]  |                          |  [HSRP]
  Switch1  |                          |  Switch2
  A_CE1---+                          +---A_CE2
    |                                      |
   PE1 ---- PE3 ---- PE2    (MPLS L3VPN)
    \       / \       /
     P1 -------- P2
       (OSPF Area 0 + LDP)
```

## Plan d'adressage complet

### Loopbacks (OSPF/MPLS)
| Routeur | Loopback 0       |
|---------|------------------|
| PE1     | 172.16.1.1/32    |
| PE2     | 172.16.1.2/32    |
| PE3     | 172.16.1.3/32    |
| P1      | 172.16.1.4/32    |
| P2      | 172.16.1.5/32    |

### Liens Core OSPF Area 0 (80.0.0.x/30)
| Lien        | Subnet          | Routeur A (IP) | Int A | Routeur B (IP) | Int B |
|-------------|-----------------|----------------|-------|----------------|-------|
| PE1 — PE3   | 80.0.0.0/30     | PE1 (.1)       | s2/2  | PE3 (.2)       | s2/1  |
| PE3 — PE2   | 80.0.0.8/30     | PE3 (.9)       | s2/3  | PE2 (.10)      | s2/2  |
| PE1 — P1    | 80.0.0.12/30    | PE1 (.13)      | s2/3  | P1 (.14)       | s2/1  |
| P1 — P2     | 80.0.0.4/30     | P1 (.5)        | s2/0  | P2 (.6)        | s2/0  |
| P2 — PE2    | 80.0.0.16/30    | P2 (.17)       | s2/3  | PE2 (.18)      | s2/3  |

### Liens CE — PE (VRF)
| Lien          | VRF       | Subnet        | CE (IP) | Int CE | PE (IP) | Int PE |
|---------------|-----------|---------------|---------|--------|---------|--------|
| A_CE1 — PE1   | CLIENT_A  | 10.1.1.0/30   | .1      | s2/0   | .2      | s2/0   |
| B_CE1 — PE1   | CLIENT_B  | 10.1.1.4/30   | .5      | s2/1   | .6      | s2/1   |
| A_CE2 — PE2   | CLIENT_A  | 10.1.2.0/30   | .1      | s2/0   | .2      | s2/0   |
| B_CE2 — PE2   | CLIENT_B  | 10.1.2.4/30   | .5      | s2/1   | .6      | s2/1   |

### LAN Clients
| Segment        | Subnet          | Gateway VIP | CE (IP) | RT (IP) | PC (IP) |
|----------------|-----------------|-------------|---------|---------|---------|
| Client A Left  | 192.168.1.0/24  | .1 (HSRP)  | A_CE1 .2| RT1 .3  | PC1 .10 |
| Client A Right | 192.168.2.0/24  | .1 (HSRP)  | A_CE2 .2| RT2 .3  | PC3 .10 |
| Client B Left  | 192.168.1.0/24  | .1          | B_CE1 .1| -       | PC2 .10 |
| Client B Right | 192.168.2.0/24  | .1          | B_CE2 .1| -       | PC4 .10 |

### Liens WAN DMVPN
| Lien           | Subnet          | Routeur A (IP) | Int A  | Routeur B (IP) | Int B  |
|----------------|-----------------|----------------|--------|----------------|--------|
| RT1 — A_CE4    | 90.0.0.0/30     | RT1 (.1)       | f0/1   | A_CE4 (.2)     | f0/0   |
| A_CE4 — RT2    | 90.0.0.4/30     | A_CE4 (.5)     | f0/1   | RT2 (.6)       | f0/1   |
| A_CE4 — PE3    | 90.0.0.8/30     | A_CE4 (.9)     | f1/0   | PE3 (.10)      | f0/0   |

### DMVPN Tunnel0
| Rôle   | Routeur | Tunnel IP   | NBMA IP    |
|--------|---------|-------------|------------|
| Hub    | PE3     | 10.0.0.1    | 90.0.0.10  |
| Spoke  | RT1     | 10.0.0.2    | 90.0.0.1   |
| Spoke  | RT2     | 10.0.0.3    | 90.0.0.6   |

### VRF
| VRF       | RD       | RT Import  | RT Export  |
|-----------|----------|------------|------------|
| CLIENT_A  | 65000:1  | 65000:1    | 65000:1    |
| CLIENT_B  | 65000:2  | 65000:2    | 65000:2    |

## Ordre d'implémentation recommandé

1. **Étape 1** : Adressage IP des interfaces core (PE1, PE2, PE3, P1, P2)
2. **Étape 2** : OSPF Area 0 dans le backbone + Loopbacks
3. **Étape 3** : Activation MPLS (LDP) sur toutes les interfaces core
4. **Étape 4** : Configuration VRF sur PE1 et PE2
5. **Étape 5** : Adressage interfaces CE-PE (dans les VRF)
6. **Étape 6** : MP-BGP entre PE1 et PE2 (VPNv4)
7. **Étape 7** : Routes statiques PE-CE + redistribution dans BGP
8. **Étape 8** : Configuration des CE (A_CE1, A_CE2, B_CE1, B_CE2)
9. **Étape 9** : Adressage WAN (RT1, RT2, A_CE4, PE3 f0/0)
10. **Étape 10** : Configuration DMVPN (PE3 hub, RT1/RT2 spokes)
11. **Étape 11** : EIGRP sur tunnel DMVPN
12. **Étape 12** : HSRP entre A_CE1/RT1 et A_CE2/RT2
13. **Étape 13** : Vérification et troubleshooting

## Chemins de trafic

### Chemin primaire (MPLS VPN)
```
PC1 → Switch1 → A_CE1 → PE1 [VRF] → MPLS Core → PE2 [VRF] → A_CE2 → Switch2 → PC3
```

### Chemin backup (DMVPN)
```
PC1 → Switch1 → RT1 → DMVPN Tunnel → PE3 (Hub) → DMVPN Tunnel → RT2 → Switch2 → PC3
```

HSRP assure le basculement automatique : si A_CE1 perd son lien WAN (s2/0),
sa priorité HSRP diminue et RT1 devient le gateway actif.
