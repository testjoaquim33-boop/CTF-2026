# ============================================================
# IAM — Groupes avec Least Privilege (Étape 2)
# Groupes : ADMIN | DEV | DBA
# ============================================================

# ---- Groupe ADMIN ----
# Accès complet à l'infrastructure (à utiliser avec parcimonie)
resource "aws_iam_group" "admin" {
  name = "${var.project_name}-ADMIN"
}

resource "aws_iam_group_policy_attachment" "admin_ec2" {
  group      = aws_iam_group.admin.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
}

resource "aws_iam_group_policy_attachment" "admin_vpc" {
  group      = aws_iam_group.admin.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonVPCFullAccess"
}

resource "aws_iam_group_policy_attachment" "admin_s3" {
  group      = aws_iam_group.admin.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_group_policy_attachment" "admin_iam_readonly" {
  group      = aws_iam_group.admin.name
  # Les admins peuvent lire IAM mais pas modifier (principe PoLP)
  policy_arn = "arn:aws:iam::aws:policy/IAMReadOnlyAccess"
}

resource "aws_iam_group_policy_attachment" "admin_cloudwatch" {
  group      = aws_iam_group.admin.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchFullAccess"
}

# ---- Groupe DEV ----
# Accès limité : lecture EC2, déploiement S3, Lambda, CloudWatch logs
resource "aws_iam_group" "dev" {
  name = "${var.project_name}-DEV"
}

resource "aws_iam_policy" "dev_policy" {
  name        = "${var.project_name}-dev-policy"
  description = "Permissions DEV — Least Privilege"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Lecture EC2 (voir les instances, statuts)
        Sid    = "EC2ReadOnly"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:Get*",
          "ec2:List*"
        ]
        Resource = "*"
      },
      {
        # Déploiement S3 (lecture/écriture sur les buckets du projet)
        Sid    = "S3Deploy"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-*",
          "arn:aws:s3:::${var.project_name}-*/*"
        ]
      },
      {
        # Lambda — déployer et invoquer des fonctions
        Sid    = "LambdaDeploy"
        Effect = "Allow"
        Action = [
          "lambda:GetFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:InvokeFunction",
          "lambda:ListFunctions"
        ]
        Resource = "arn:aws:lambda:*:*:function:${var.project_name}-*"
      },
      {
        # CloudWatch — lire les logs applicatifs
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:GetLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy_attachment" "dev_policy" {
  group      = aws_iam_group.dev.name
  policy_arn = aws_iam_policy.dev_policy.arn
}

# ---- Groupe DBA ----
# Accès uniquement aux instances DB (via Session Manager ou SSH via bastion)
resource "aws_iam_group" "dba" {
  name = "${var.project_name}-DBA"
}

resource "aws_iam_policy" "dba_policy" {
  name        = "${var.project_name}-dba-policy"
  description = "Permissions DBA — accès DB uniquement"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Lire les informations EC2 (pour identifier les instances DB)
        Sid    = "EC2ReadOnly"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus"
        ]
        Resource = "*"
      },
      {
        # SSM Session Manager — accès sécurisé aux instances DB uniquement
        Sid    = "SSMSessionDB"
        Effect = "Allow"
        Action = [
          "ssm:StartSession",
          "ssm:TerminateSession",
          "ssm:ResumeSession",
          "ssm:DescribeSessions"
        ]
        Resource = [
          "arn:aws:ec2:*:*:instance/*",
          "arn:aws:ssm:*:*:document/AWS-StartSSHSession"
        ]
        Condition = {
          StringLike = {
            "ssm:resourceTag/Name" = ["*-db-*"]
          }
        }
      },
      {
        # Snapshots RDS/EBS pour les sauvegardes DB
        Sid    = "DBBackup"
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:DescribeSnapshots",
          "ec2:DeleteSnapshot"
        ]
        Resource = "*"
      },
      {
        # CloudWatch — surveiller les métriques DB
        Sid    = "CloudWatchReadDB"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:DescribeAlarms"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy_attachment" "dba_policy" {
  group      = aws_iam_group.dba.name
  policy_arn = aws_iam_policy.dba_policy.arn
}

# ============================================================
# ROLE IAM pour les instances EC2 (accès SSM + S3 logs)
# ============================================================
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

# SSM pour accès sécurisé aux instances sans ouvrir le port 22 publiquement
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch agent
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# ============================================================
# ROLE IAM pour Lambda (accès S3)
# ============================================================
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "lambda_s3_policy" {
  name = "${var.project_name}-lambda-s3-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-lambda-*",
          "arn:aws:s3:::${var.project_name}-lambda-*/*"
        ]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
}

# ============================================================
# ROLE IAM pour IMDS Test (Étape 9) — accès S3 limité
# ============================================================
resource "aws_iam_role" "imds_test_role" {
  name = "${var.project_name}-imds-test-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "imds_s3_readonly" {
  role       = aws_iam_role.imds_test_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

resource "aws_iam_instance_profile" "imds_test_profile" {
  name = "${var.project_name}-imds-test-profile"
  role = aws_iam_role.imds_test_role.name
}
