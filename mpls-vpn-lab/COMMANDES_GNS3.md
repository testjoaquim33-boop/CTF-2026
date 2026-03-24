# Commandes GNS3 - Copier-coller dans l'ordre

---

## ÉTAPE 1 : BACKBONE OSPF + MPLS (Coeur opérateur)

Commence par les routeurs du coeur. Fais-les tous avant de passer à l'étape 2.

---

### P1 (double-clic → console)

```
enable
configure terminal

hostname P1
ip cef

interface Loopback0
 ip address 172.16.1.4 255.255.255.255

interface Serial2/1
 description VERS PE1
 ip address 80.0.0.14 255.255.255.252
 no shutdown

interface Serial2/0
 description VERS P2
 ip address 80.0.0.5 255.255.255.252
 no shutdown

router ospf 1
 router-id 172.16.1.4
 network 172.16.1.4 0.0.0.0 area 0
 network 80.0.0.4 0.0.0.3 area 0
 network 80.0.0.12 0.0.0.3 area 0

mpls ldp router-id Loopback0 force

interface Serial2/1
 mpls ip
interface Serial2/0
 mpls ip

end
write memory
```

---

### P2 (double-clic → console)

```
enable
configure terminal

hostname P2
ip cef

interface Loopback0
 ip address 172.16.1.5 255.255.255.255

interface Serial2/0
 description VERS P1
 ip address 80.0.0.6 255.255.255.252
 no shutdown

interface Serial2/3
 description VERS PE2
 ip address 80.0.0.17 255.255.255.252
 no shutdown

router ospf 1
 router-id 172.16.1.5
 network 172.16.1.5 0.0.0.0 area 0
 network 80.0.0.4 0.0.0.3 area 0
 network 80.0.0.16 0.0.0.3 area 0

mpls ldp router-id Loopback0 force

interface Serial2/0
 mpls ip
interface Serial2/3
 mpls ip

end
write memory
```

---

### PE3 (double-clic → console) — Partie 1 : Core uniquement

```
enable
configure terminal

hostname PE3
ip cef

interface Loopback0
 ip address 172.16.1.3 255.255.255.255

interface Serial2/1
 description VERS PE1
 ip address 80.0.0.2 255.255.255.252
 no shutdown

interface Serial2/3
 description VERS PE2
 ip address 80.0.0.9 255.255.255.252
 no shutdown

router ospf 1
 router-id 172.16.1.3
 network 172.16.1.3 0.0.0.0 area 0
 network 80.0.0.0 0.0.0.3 area 0
 network 80.0.0.8 0.0.0.3 area 0

mpls ldp router-id Loopback0 force

interface Serial2/1
 mpls ip
interface Serial2/3
 mpls ip

end
write memory
```

---

### PE1 (double-clic → console) — Partie 1 : Core uniquement

```
enable
configure terminal

hostname PE1
ip cef

interface Loopback0
 ip address 172.16.1.1 255.255.255.255

interface Serial2/2
 description VERS PE3
 ip address 80.0.0.1 255.255.255.252
 no shutdown

interface Serial2/3
 description VERS P1
 ip address 80.0.0.13 255.255.255.252
 no shutdown

router ospf 1
 router-id 172.16.1.1
 network 172.16.1.1 0.0.0.0 area 0
 network 80.0.0.0 0.0.0.3 area 0
 network 80.0.0.12 0.0.0.3 area 0

mpls ldp router-id Loopback0 force

interface Serial2/2
 mpls ip
interface Serial2/3
 mpls ip

end
write memory
```

---

### PE2 (double-clic → console) — Partie 1 : Core uniquement

```
enable
configure terminal

hostname PE2
ip cef

interface Loopback0
 ip address 172.16.1.2 255.255.255.255

interface Serial2/2
 description VERS PE3
 ip address 80.0.0.10 255.255.255.252
 no shutdown

interface Serial2/3
 description VERS P2
 ip address 80.0.0.18 255.255.255.252
 no shutdown

router ospf 1
 router-id 172.16.1.2
 network 172.16.1.2 0.0.0.0 area 0
 network 80.0.0.8 0.0.0.3 area 0
 network 80.0.0.16 0.0.0.3 area 0

mpls ldp router-id Loopback0 force

interface Serial2/2
 mpls ip
interface Serial2/3
 mpls ip

end
write memory
```

---

### VÉRIFICATION ÉTAPE 1

Tape ça sur **chaque routeur core** pour vérifier :

```
show ip ospf neighbor
show mpls ldp neighbor
show mpls interfaces
```

Tu dois voir les voisins OSPF en **FULL** et les voisins LDP.
Si c'est bon, passe à l'étape 2.

---

## ÉTAPE 2 : VRF + MP-BGP sur PE1 et PE2

---

### PE1 — Partie 2 : VRF + BGP

```
enable
configure terminal

ip vrf CLIENT_A
 rd 65000:1
 route-target export 65000:1
 route-target import 65000:1
 exit

ip vrf CLIENT_B
 rd 65000:2
 route-target export 65000:2
 route-target import 65000:2
 exit

interface Serial2/0
 description VERS A_CE1
 ip vrf forwarding CLIENT_A
 ip address 10.1.1.2 255.255.255.252
 no shutdown

interface Serial2/1
 description VERS B_CE1
 ip vrf forwarding CLIENT_B
 ip address 10.1.1.6 255.255.255.252
 no shutdown

router bgp 65000
 bgp router-id 172.16.1.1
 no bgp default ipv4-unicast
 neighbor 172.16.1.2 remote-as 65000
 neighbor 172.16.1.2 update-source Loopback0
 address-family vpnv4
  neighbor 172.16.1.2 activate
  neighbor 172.16.1.2 send-community extended
  exit-address-family
 address-family ipv4 vrf CLIENT_A
  redistribute static
  exit-address-family
 address-family ipv4 vrf CLIENT_B
  redistribute static
  exit-address-family

ip route vrf CLIENT_A 192.168.1.0 255.255.255.0 10.1.1.1
ip route vrf CLIENT_B 192.168.1.0 255.255.255.0 10.1.1.5

end
write memory
```

---

### PE2 — Partie 2 : VRF + BGP

```
enable
configure terminal

ip vrf CLIENT_A
 rd 65000:1
 route-target export 65000:1
 route-target import 65000:1
 exit

ip vrf CLIENT_B
 rd 65000:2
 route-target export 65000:2
 route-target import 65000:2
 exit

interface Serial2/0
 description VERS A_CE2
 ip vrf forwarding CLIENT_A
 ip address 10.1.2.2 255.255.255.252
 no shutdown

interface Serial2/1
 description VERS B_CE2
 ip vrf forwarding CLIENT_B
 ip address 10.1.2.6 255.255.255.252
 no shutdown

router bgp 65000
 bgp router-id 172.16.1.2
 no bgp default ipv4-unicast
 neighbor 172.16.1.1 remote-as 65000
 neighbor 172.16.1.1 update-source Loopback0
 address-family vpnv4
  neighbor 172.16.1.1 activate
  neighbor 172.16.1.1 send-community extended
  exit-address-family
 address-family ipv4 vrf CLIENT_A
  redistribute static
  exit-address-family
 address-family ipv4 vrf CLIENT_B
  redistribute static
  exit-address-family

ip route vrf CLIENT_A 192.168.2.0 255.255.255.0 10.1.2.1
ip route vrf CLIENT_B 192.168.2.0 255.255.255.0 10.1.2.5

end
write memory
```

---

### VÉRIFICATION ÉTAPE 2

Sur **PE1** :

```
show bgp vpnv4 unicast all summary
show ip vrf
show ip route vrf CLIENT_A
```

Tu dois voir le neighbor **172.16.1.2** en état **Established**.

---

## ÉTAPE 3 : ROUTEURS CE (Client Edge)

---

### A_CE1

```
enable
configure terminal

hostname A_CE1
ip cef

interface Serial2/0
 description VERS PE1
 ip address 10.1.1.1 255.255.255.252
 no shutdown

interface FastEthernet0/0
 description LAN Client A gauche
 ip address 192.168.1.2 255.255.255.0
 standby 1 ip 192.168.1.1
 standby 1 priority 110
 standby 1 preempt
 standby 1 track Serial2/0 20
 no shutdown

ip route 192.168.2.0 255.255.255.0 10.1.1.2
ip route 0.0.0.0 0.0.0.0 10.1.1.2

end
write memory
```

---

### A_CE2

```
enable
configure terminal

hostname A_CE2
ip cef

interface Serial2/0
 description VERS PE2
 ip address 10.1.2.1 255.255.255.252
 no shutdown

interface FastEthernet0/0
 description LAN Client A droite
 ip address 192.168.2.2 255.255.255.0
 standby 1 ip 192.168.2.1
 standby 1 priority 110
 standby 1 preempt
 standby 1 track Serial2/0 20
 no shutdown

ip route 192.168.1.0 255.255.255.0 10.1.2.2
ip route 0.0.0.0 0.0.0.0 10.1.2.2

end
write memory
```

---

### B_CE1

```
enable
configure terminal

hostname B_CE1
ip cef

interface Serial2/1
 description VERS PE1
 ip address 10.1.1.5 255.255.255.252
 no shutdown

interface FastEthernet0/0
 description LAN Client B gauche
 ip address 192.168.1.1 255.255.255.0
 no shutdown

ip route 192.168.2.0 255.255.255.0 10.1.1.6
ip route 0.0.0.0 0.0.0.0 10.1.1.6

end
write memory
```

---

### B_CE2

```
enable
configure terminal

hostname B_CE2
ip cef

interface Serial2/1
 description VERS PE2
 ip address 10.1.2.5 255.255.255.252
 no shutdown

interface FastEthernet0/0
 description LAN Client B droite
 ip address 192.168.2.1 255.255.255.0
 no shutdown

ip route 192.168.1.0 255.255.255.0 10.1.2.6
ip route 0.0.0.0 0.0.0.0 10.1.2.6

end
write memory
```

---

### VÉRIFICATION ÉTAPE 3

Sur **PE1** :

```
ping vrf CLIENT_A 10.1.1.1
ping vrf CLIENT_B 10.1.1.5
ping vrf CLIENT_A 192.168.2.10 source 10.1.1.2
show ip route vrf CLIENT_A
show ip bgp vpnv4 vrf CLIENT_A
```

Tu dois voir les routes **192.168.1.0/24** (locale) et **192.168.2.0/24** (via BGP).

---

## ÉTAPE 4 : DMVPN (Backup path)

---

### A_CE4 (routeur transit)

```
enable
configure terminal

hostname A_CE4
ip cef

interface FastEthernet0/0
 description VERS RT1
 ip address 90.0.0.2 255.255.255.252
 no shutdown

interface FastEthernet0/1
 description VERS RT2
 ip address 90.0.0.5 255.255.255.252
 no shutdown

interface FastEthernet1/0
 description VERS PE3
 ip address 90.0.0.9 255.255.255.252
 no shutdown

end
write memory
```

---

### PE3 — Partie 2 : DMVPN Hub

```
enable
configure terminal

interface FastEthernet0/0
 description VERS A_CE4
 ip address 90.0.0.10 255.255.255.252
 no shutdown

ip route 90.0.0.0 255.255.255.252 90.0.0.9
ip route 90.0.0.4 255.255.255.252 90.0.0.9

interface Tunnel0
 ip address 10.0.0.1 255.255.255.0
 tunnel source FastEthernet0/0
 tunnel mode gre multipoint
 tunnel key 100
 ip nhrp network-id 1
 ip nhrp map multicast dynamic
 ip nhrp redirect
 ip mtu 1400
 ip tcp adjust-mss 1360
 no ip split-horizon eigrp 100
 no shutdown

router eigrp 100
 network 10.0.0.0 0.0.0.255
 no auto-summary

end
write memory
```

---

### RT1_BACKUP

```
enable
configure terminal

hostname RT1_BACKUP
ip cef

interface FastEthernet0/1
 description VERS A_CE4
 ip address 90.0.0.1 255.255.255.252
 no shutdown

ip route 90.0.0.8 255.255.255.252 90.0.0.2

interface Tunnel0
 ip address 10.0.0.2 255.255.255.0
 tunnel source FastEthernet0/1
 tunnel mode gre multipoint
 tunnel key 100
 ip nhrp network-id 1
 ip nhrp nhs 10.0.0.1 nbma 90.0.0.10 multicast
 ip nhrp shortcut
 ip mtu 1400
 ip tcp adjust-mss 1360
 no shutdown

interface FastEthernet0/0
 description LAN Client A gauche
 ip address 192.168.1.3 255.255.255.0
 standby 1 ip 192.168.1.1
 standby 1 priority 100
 standby 1 preempt
 no shutdown

router eigrp 100
 network 10.0.0.0 0.0.0.255
 network 192.168.1.0 0.0.0.255
 no auto-summary

end
write memory
```

---

### RT2_BACKUP

```
enable
configure terminal

hostname RT2_BACKUP
ip cef

interface FastEthernet0/1
 description VERS A_CE4
 ip address 90.0.0.6 255.255.255.252
 no shutdown

ip route 90.0.0.8 255.255.255.252 90.0.0.5

interface Tunnel0
 ip address 10.0.0.3 255.255.255.0
 tunnel source FastEthernet0/1
 tunnel mode gre multipoint
 tunnel key 100
 ip nhrp network-id 1
 ip nhrp nhs 10.0.0.1 nbma 90.0.0.10 multicast
 ip nhrp shortcut
 ip mtu 1400
 ip tcp adjust-mss 1360
 no shutdown

interface FastEthernet0/0
 description LAN Client A droite
 ip address 192.168.2.3 255.255.255.0
 standby 1 ip 192.168.2.1
 standby 1 priority 100
 standby 1 preempt
 no shutdown

router eigrp 100
 network 10.0.0.0 0.0.0.255
 network 192.168.2.0 0.0.0.255
 no auto-summary

end
write memory
```

---

### VÉRIFICATION ÉTAPE 4

Sur **PE3** :

```
show dmvpn
show ip nhrp
show ip eigrp neighbors
```

Sur **RT1_BACKUP** :

```
show dmvpn
show ip nhrp nhs
show ip route eigrp
ping 10.0.0.1
ping 10.0.0.3
```

Tu dois voir RT1 et RT2 comme voisins EIGRP sur PE3, et les routes 192.168.x.0 apprises via EIGRP.

---

## ÉTAPE 5 : PCs (VPCS)

---

### PC1

```
ip 192.168.1.10 255.255.255.0 192.168.1.1
```

### PC2

```
ip 192.168.1.10 255.255.255.0 192.168.1.1
```

### PC3

```
ip 192.168.2.10 255.255.255.0 192.168.2.1
```

### PC4

```
ip 192.168.2.10 255.255.255.0 192.168.2.1
```

---

## ÉTAPE 6 : TESTS FINAUX

---

### Test 1 : Chemin primaire (MPLS VPN)

Depuis **PC1** :

```
ping 192.168.2.10
trace 192.168.2.10
```

### Test 2 : HSRP OK ?

Sur **A_CE1** :

```
show standby brief
```

Tu dois voir : `Active` sur A_CE1, `Standby` sur RT1.

### Test 3 : Failover (couper le lien primaire)

Sur **A_CE1** :

```
configure terminal
interface Serial2/0
 shutdown
end
```

Attends 10 secondes, puis sur **RT1_BACKUP** :

```
show standby brief
```

RT1 doit être passé **Active**.

Depuis **PC1** :

```
ping 192.168.2.10
trace 192.168.2.10
```

Le trafic passe maintenant par le tunnel DMVPN (10.0.0.x).

### Test 4 : Restaurer le primaire

Sur **A_CE1** :

```
configure terminal
interface Serial2/0
 no shutdown
end
```

A_CE1 redevient Active (grâce au `preempt`).

---

## SI ÇA NE PING PAS — Checklist debug

```
! 1. PC1 ping sa gateway ?
ping 192.168.1.1

! 2. HSRP actif ?
show standby brief          (sur A_CE1)

! 3. CE1 joint PE1 ?
ping 10.1.1.2               (sur A_CE1)

! 4. PE1 a la route VPN ?
show ip route vrf CLIENT_A  (sur PE1)

! 5. BGP monté ?
show bgp vpnv4 unicast all summary  (sur PE1)

! 6. Labels MPLS ?
show mpls forwarding-table  (sur PE1)

! 7. PE2 a la route retour ?
show ip route vrf CLIENT_A  (sur PE2)

! 8. PE2 joint CE2 ?
ping vrf CLIENT_A 10.1.2.1  (sur PE2)

! 9. DMVPN monté ?
show dmvpn                  (sur PE3)

! 10. EIGRP voisins ?
show ip eigrp neighbors     (sur PE3)
```
