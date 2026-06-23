output "vpc_id" {
  description = "ID du VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs des subnets publics"
  value       = module.vpc.public_subnet_ids
}

output "private_app_subnet_ids" {
  description = "IDs des subnets privés applicatifs"
  value       = module.vpc.private_app_subnet_ids
}

output "private_db_subnet_ids" {
  description = "IDs des subnets privés DB"
  value       = module.vpc.private_db_subnet_ids
}

output "alb_dns_name" {
  description = "DNS du Load Balancer (accès public à l'application)"
  value       = module.alb.alb_dns_name
}

output "bastion_public_ip" {
  description = "IP publique du serveur Bastion"
  value       = module.ec2.bastion_public_ip
}

output "web1_private_ip" {
  description = "IP privée du serveur Web 1"
  value       = module.ec2.web1_private_ip
}

output "web2_private_ip" {
  description = "IP privée du serveur Web 2"
  value       = module.ec2.web2_private_ip
}

output "db_private_ip" {
  description = "IP privée du serveur DB"
  value       = module.ec2.db_private_ip
}

output "s3_static_website_url" {
  description = "URL du site statique S3 (Étape 6)"
  value       = module.s3.static_website_url
}

output "lambda_function_name" {
  description = "Nom de la fonction Lambda (Étape 10)"
  value       = module.lambda.function_name
}

output "iam_admin_group" {
  description = "Groupe IAM ADMIN"
  value       = module.iam.admin_group_name
}

output "iam_dev_group" {
  description = "Groupe IAM DEV"
  value       = module.iam.dev_group_name
}

output "iam_dba_group" {
  description = "Groupe IAM DBA"
  value       = module.iam.dba_group_name
}
