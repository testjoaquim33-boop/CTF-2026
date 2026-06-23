# ============================================================
# EC2 INSTANCES — Architecture TIER3 (Étape 4)
# Bastion (public) | Web1 + Web2 (privé app, 2 AZs) | DB (privé db)
# ============================================================

# ---- User Data : page web avec identification du serveur ----
locals {
  web1_userdata = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y apache2
    systemctl enable apache2
    systemctl start apache2
    PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
    cat > /var/www/html/index.html <<HTML
    <!DOCTYPE html>
    <html>
    <head><title>SDV Cloud — Serveur Web 1</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f0f4f8; text-align: center; padding: 50px; }
      .card { background: white; border-radius: 12px; padding: 40px; max-width: 500px; margin: auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
      h1 { color: #e05c00; }
      .ip { font-size: 1.5em; font-weight: bold; color: #0073bb; }
    </style>
    </head>
    <body>
    <div class="card">
      <h1>SUP DE VINCI — Cloud Security</h1>
      <p>Serveur Web <strong>1</strong> — Zone : <em>eu-west-1a</em></p>
      <p>IP Privée : <span class="ip">$PRIVATE_IP</span></p>
      <p>Architecture TIER3 — Load Balanced</p>
    </div>
    </body>
    </html>
    HTML
    # Installer Lynis pour le scan de vulnérabilités (Étape 7)
    apt-get install -y lynis
  EOF

  web2_userdata = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y apache2
    systemctl enable apache2
    systemctl start apache2
    PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
    cat > /var/www/html/index.html <<HTML
    <!DOCTYPE html>
    <html>
    <head><title>SDV Cloud — Serveur Web 2</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f0f4f8; text-align: center; padding: 50px; }
      .card { background: white; border-radius: 12px; padding: 40px; max-width: 500px; margin: auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
      h1 { color: #00a8e1; }
      .ip { font-size: 1.5em; font-weight: bold; color: #0073bb; }
    </style>
    </head>
    <body>
    <div class="card">
      <h1>SUP DE VINCI — Cloud Security</h1>
      <p>Serveur Web <strong>2</strong> — Zone : <em>eu-west-1b</em></p>
      <p>IP Privée : <span class="ip">$PRIVATE_IP</span></p>
      <p>Architecture TIER3 — Load Balanced</p>
    </div>
    </body>
    </html>
    HTML
    apt-get install -y lynis
  EOF

  db_userdata = <<-EOF
    #!/bin/bash
    apt-get update -y
    # Installer MySQL Server (simuler la couche DB)
    apt-get install -y mysql-server
    systemctl enable mysql
    systemctl start mysql
    # Sécuriser MySQL basiquement
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SDVcloud2026!';"
    mysql -e "DELETE FROM mysql.user WHERE User='';"
    mysql -e "DROP DATABASE IF EXISTS test;"
    mysql -e "FLUSH PRIVILEGES;"
  EOF
}

# ============================================================
# BASTION HOST — Subnet public AZ-a
# ============================================================
resource "aws_instance" "bastion" {
  ami                         = var.ami_ubuntu
  instance_type               = var.instance_type
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [var.sg_bastion_id]
  key_name                    = var.key_pair_name
  iam_instance_profile        = var.iam_instance_profile
  associate_public_ip_address = true

  # IMDSv2 obligatoire sur toutes les instances (sécurité Étape 9)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 8
    delete_on_termination = true
    encrypted             = true
  }

  tags = { Name = "${var.project_name}-bastion" }

  lifecycle {
    # Garder le bastion arrêté par défaut (économiser les coûts)
    ignore_changes = [associate_public_ip_address]
  }
}

# ============================================================
# SERVEUR WEB 1 — Subnet privé app AZ-a
# ============================================================
resource "aws_instance" "web1" {
  ami                         = var.ami_ubuntu
  instance_type               = var.instance_type
  subnet_id                   = var.private_app_subnet_ids[0]
  vpc_security_group_ids      = [var.sg_web_id]
  key_name                    = var.key_pair_name
  iam_instance_profile        = var.iam_instance_profile
  associate_public_ip_address = false
  user_data                   = local.web1_userdata

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 8
    delete_on_termination = true
    encrypted             = true
  }

  tags = { Name = "${var.project_name}-web1" }
}

# ============================================================
# SERVEUR WEB 2 — Subnet privé app AZ-b (résilience)
# ============================================================
resource "aws_instance" "web2" {
  ami                         = var.ami_ubuntu
  instance_type               = var.instance_type
  subnet_id                   = var.private_app_subnet_ids[1]
  vpc_security_group_ids      = [var.sg_web_id]
  key_name                    = var.key_pair_name
  iam_instance_profile        = var.iam_instance_profile
  associate_public_ip_address = false
  user_data                   = local.web2_userdata

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 8
    delete_on_termination = true
    encrypted             = true
  }

  tags = { Name = "${var.project_name}-web2" }
}

# ============================================================
# SERVEUR DB — Subnet privé DB AZ-a (instance EC2 vide)
# ============================================================
resource "aws_instance" "db" {
  ami                         = var.ami_ubuntu
  instance_type               = var.instance_type
  subnet_id                   = var.private_db_subnet_id
  vpc_security_group_ids      = [var.sg_db_id]
  key_name                    = var.key_pair_name
  iam_instance_profile        = var.iam_instance_profile
  associate_public_ip_address = false
  user_data                   = local.db_userdata

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 8
    delete_on_termination = true
    encrypted             = true
  }

  tags = { Name = "${var.project_name}-db" }
}

# ============================================================
# ENREGISTREMENT DES SERVEURS WEB DANS LE TARGET GROUP ALB
# ============================================================
resource "aws_lb_target_group_attachment" "web1" {
  target_group_arn = var.alb_target_group_arn
  target_id        = aws_instance.web1.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "web2" {
  target_group_arn = var.alb_target_group_arn
  target_id        = aws_instance.web2.id
  port             = 80
}
