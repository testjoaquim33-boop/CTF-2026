# ============================================================
# SECURITY GROUPS — Segmentation réseau stricte (Étape 5)
# Principe : deny by default, autoriser seulement le flux nécessaire
# ============================================================

# ---- SG Application Load Balancer ----
# Accepte HTTP/HTTPS depuis Internet, ouvre vers les Web servers
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-sg-alb"
  description = "Security Group du Load Balancer — accès public HTTP/HTTPS"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP depuis Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS depuis Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Vers les serveurs web (port 80)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = { Name = "${var.project_name}-sg-alb" }
}

# ---- SG Bastion Host ----
# Accepte SSH uniquement depuis l'IP admin, forward SSH vers serveurs privés
resource "aws_security_group" "bastion" {
  name        = "${var.project_name}-sg-bastion"
  description = "Security Group du Bastion — SSH restreint admin uniquement"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH depuis IP admin uniquement"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ip_cidr]
  }

  egress {
    description = "SSH vers serveurs privés du VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = { Name = "${var.project_name}-sg-bastion" }
}

# ---- SG Serveurs Web ----
# Accepte HTTP depuis ALB seulement + SSH depuis Bastion seulement
resource "aws_security_group" "web" {
  name        = "${var.project_name}-sg-web"
  description = "Security Group des serveurs web — flux depuis ALB et Bastion uniquement"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP depuis le Load Balancer uniquement"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "SSH depuis le Bastion uniquement"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  # Les serveurs web ont besoin d'accès DB
  egress {
    description = "Vers serveur DB (MySQL)"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Réponses HTTP (ports éphémères)
  egress {
    description = "Réponses HTTP/HTTPS sortantes"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = { Name = "${var.project_name}-sg-web" }
}

# ---- SG Base de Données ----
# Accepte MySQL uniquement depuis serveurs Web + SSH depuis Bastion
resource "aws_security_group" "db" {
  name        = "${var.project_name}-sg-db"
  description = "Security Group DB — MySQL depuis Web, SSH depuis Bastion"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MySQL depuis serveurs web uniquement"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  ingress {
    description     = "SSH depuis Bastion uniquement (pour DBA)"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  # Pas d'accès internet depuis la DB
  egress {
    description = "Réponses vers VPC uniquement"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = { Name = "${var.project_name}-sg-db" }
}
