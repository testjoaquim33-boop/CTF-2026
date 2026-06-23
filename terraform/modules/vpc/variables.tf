variable "project_name" { type = string }
variable "vpc_cidr" { type = string }
variable "public_subnet_cidrs" { type = list(string) }
variable "private_app_subnet_cidrs" { type = list(string) }
variable "private_db_subnet_cidrs" { type = list(string) }
variable "availability_zones" { type = list(string) }

variable "public_subnet_cidr_combined" {
  description = "CIDR résumant les subnets publics pour les ACLs"
  type        = string
  default     = "10.0.0.0/22"
}

variable "private_app_subnet_cidr_combined" {
  description = "CIDR résumant les subnets privés app pour les ACLs"
  type        = string
  default     = "10.0.8.0/21"
}
