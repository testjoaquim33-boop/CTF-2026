terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# ============================================================
# MODULE VPC — Réseau complet (Étape 3)
# ============================================================
module "vpc" {
  source = "./modules/vpc"

  project_name             = var.project_name
  vpc_cidr                 = var.vpc_cidr
  public_subnet_cidrs      = var.public_subnet_cidrs
  private_app_subnet_cidrs = var.private_app_subnet_cidrs
  private_db_subnet_cidrs  = var.private_db_subnet_cidrs
  availability_zones       = var.availability_zones
}

# ============================================================
# MODULE IAM — Groupes et permissions (Étape 2)
# ============================================================
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
}

# ============================================================
# MODULE SECURITY GROUPS (Étape 5)
# ============================================================
module "security" {
  source = "./modules/security"

  project_name   = var.project_name
  vpc_id         = module.vpc.vpc_id
  vpc_cidr       = var.vpc_cidr
  admin_ip_cidr  = var.admin_ip_cidr
}

# ============================================================
# MODULE ALB — Application Load Balancer (Étape 3 & 4)
# ============================================================
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  sg_alb_id          = module.security.sg_alb_id
}

# ============================================================
# MODULE EC2 — Instances (Étape 4)
# ============================================================
module "ec2" {
  source = "./modules/ec2"

  project_name          = var.project_name
  ami_ubuntu            = var.ami_ubuntu
  instance_type         = var.instance_type
  key_pair_name         = var.key_pair_name

  # Bastion dans subnet public AZ-a
  public_subnet_id      = module.vpc.public_subnet_ids[0]

  # Web servers dans subnets privés applicatifs
  private_app_subnet_ids = module.vpc.private_app_subnet_ids

  # DB dans subnet privé DB AZ-a
  private_db_subnet_id  = module.vpc.private_db_subnet_ids[0]

  sg_bastion_id         = module.security.sg_bastion_id
  sg_web_id             = module.security.sg_web_id
  sg_db_id              = module.security.sg_db_id

  alb_target_group_arn  = module.alb.target_group_arn

  iam_instance_profile  = module.iam.ec2_instance_profile_name
}

# ============================================================
# MODULE S3 — Site statique + bucket Lambda (Étapes 6 & 10)
# ============================================================
module "s3" {
  source = "./modules/s3"

  project_name          = var.project_name
  static_bucket_name    = var.s3_static_bucket_name
  lambda_bucket_name    = var.s3_lambda_bucket_name
  lambda_function_arn   = module.lambda.function_arn
}

# ============================================================
# MODULE LAMBDA — Architecture événementielle (Étape 10)
# ============================================================
module "lambda" {
  source = "./modules/lambda"

  project_name       = var.project_name
  lambda_bucket_name = var.s3_lambda_bucket_name
  iam_lambda_role_arn = module.iam.lambda_role_arn
}
