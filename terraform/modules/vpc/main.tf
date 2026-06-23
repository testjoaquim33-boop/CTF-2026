# ============================================================
# VPC — Architecture TIER3 avec 3 couches réseau
# Public (LB + Bastion) | Private App (Web) | Private DB
# ============================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project_name}-vpc" }
}

# ---- Internet Gateway (accès public) ----
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-igw" }
}

# ============================================================
# SUBNETS PUBLICS — Tier 1 (Load Balancer + Bastion)
# ============================================================
resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  # Les instances publiques reçoivent une IP publique automatiquement
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-public-${var.availability_zones[count.index]}" }
}

# ============================================================
# SUBNETS PRIVÉS APPLICATIFS — Tier 2 (Serveurs Web)
# ============================================================
resource "aws_subnet" "private_app" {
  count             = length(var.private_app_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_app_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = false

  tags = { Name = "${var.project_name}-private-app-${var.availability_zones[count.index]}" }
}

# ============================================================
# SUBNETS PRIVÉS BASE DE DONNÉES — Tier 3
# ============================================================
resource "aws_subnet" "private_db" {
  count             = length(var.private_db_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_db_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = false

  tags = { Name = "${var.project_name}-private-db-${var.availability_zones[count.index]}" }
}

# ============================================================
# ROUTE TABLES
# ============================================================

# Table de routage publique — route vers IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = { Name = "${var.project_name}-rt-public" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Table de routage privée App (pas de route internet — pas de NAT Gateway)
resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-rt-private-app" }
}

resource "aws_route_table_association" "private_app" {
  count          = length(aws_subnet.private_app)
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app.id
}

# Table de routage privée DB
resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-rt-private-db" }
}

resource "aws_route_table_association" "private_db" {
  count          = length(aws_subnet.private_db)
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db.id
}

# ============================================================
# NETWORK ACLs (Étape 5)
# ============================================================

# NACL Subnets Publics
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  # Entrée : autoriser HTTP, HTTPS, SSH depuis Internet
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  ingress {
    rule_no    = 120
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }
  # Ports éphémères retour
  ingress {
    rule_no    = 130
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Sortie : tout autoriser depuis subnet public
  egress {
    rule_no    = 100
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = { Name = "${var.project_name}-nacl-public" }
}

# NACL Subnets Privés App
resource "aws_network_acl" "private_app" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private_app[*].id

  # Entrée depuis subnets publics seulement (HTTP + SSH depuis bastion)
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 80
    to_port    = 80
  }
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 22
    to_port    = 22
  }
  ingress {
    rule_no    = 120
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }

  # Sortie vers le VPC
  egress {
    rule_no    = 100
    protocol   = "-1"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  tags = { Name = "${var.project_name}-nacl-private-app" }
}

# NACL Subnets Privés DB (le plus restrictif)
resource "aws_network_acl" "private_db" {
  vpc_id     = aws_subnet.private_db[0].vpc_id
  subnet_ids = aws_subnet.private_db[*].id

  # Entrée seulement depuis subnet privé app (port DB MySQL 3306)
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.private_app_subnet_cidr_combined
    from_port  = 3306
    to_port    = 3306
  }
  # SSH depuis subnet public (bastion uniquement)
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.public_subnet_cidr_combined
    from_port  = 22
    to_port    = 22
  }
  ingress {
    rule_no    = 120
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    rule_no    = 100
    protocol   = "-1"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  tags = { Name = "${var.project_name}-nacl-private-db" }
}
