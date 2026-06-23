variable "aws_region" {
  description = "Region AWS principale"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Nom du projet (préfixe pour tous les ressources)"
  type        = string
  default     = "sdv-cloud"
}

variable "vpc_cidr" {
  description = "CIDR block du VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Subnets publics (Load Balancer + Bastion)
variable "public_subnet_cidrs" {
  description = "CIDRs des subnets publics (une par AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

# Subnets privés applicatifs (serveurs Web)
variable "private_app_subnet_cidrs" {
  description = "CIDRs des subnets privés applicatifs"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# Subnets privés base de données
variable "private_db_subnet_cidrs" {
  description = "CIDRs des subnets privés base de données"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "availability_zones" {
  description = "Zones de disponibilité (2 pour la résilience)"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b"]
}

# EC2 — utiliser Ubuntu 22.04 LTS (non Amazon Linux, gratuit Free Tier)
variable "ami_ubuntu" {
  description = "AMI Ubuntu 22.04 LTS (eu-west-1)"
  type        = string
  default     = "ami-0905a3c97561e0b69"
}

variable "instance_type" {
  description = "Type instance EC2 (t2.micro gratuit Free Tier)"
  type        = string
  default     = "t2.micro"
}

variable "key_pair_name" {
  description = "Nom de la keypair SSH existante dans AWS"
  type        = string
  default     = "sdv-cloud-key"
}

# Votre IP publique pour restreindre l'accès Bastion (remplacer par votre IP)
variable "admin_ip_cidr" {
  description = "IP de l'administrateur pour accès SSH au bastion (ex: 1.2.3.4/32)"
  type        = string
  default     = "0.0.0.0/0"  # A REMPLACER par votre IP !
}

variable "s3_static_bucket_name" {
  description = "Nom unique du bucket S3 pour le site statique"
  type        = string
  default     = "sdv-cloud-static-site-2026"
}

variable "s3_lambda_bucket_name" {
  description = "Nom unique du bucket S3 pour Lambda (Étape 10)"
  type        = string
  default     = "sdv-cloud-lambda-bucket-2026"
}

variable "tags" {
  description = "Tags communs à toutes les ressources"
  type        = map(string)
  default = {
    Project     = "SDV-Cloud-Security"
    Environment = "TP"
    ManagedBy   = "Terraform"
  }
}
