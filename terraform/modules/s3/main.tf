# ============================================================
# S3 — Site statique public (Étape 6) + Bucket Lambda (Étape 10)
# ============================================================

# ============================================================
# BUCKET S3 SITE STATIQUE (Étape 6)
# ============================================================
resource "aws_s3_bucket" "static" {
  bucket        = var.static_bucket_name
  force_destroy = true

  tags = { Name = "${var.project_name}-static-site" }
}

# Configurer le bucket pour héberger un site web statique
resource "aws_s3_bucket_website_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  index_document { suffix = "index.html" }
  error_document { key    = "error.html" }
}

# Désactiver le Block Public Access pour le site statique
resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Politique publique en lecture seule
resource "aws_s3_bucket_policy" "static" {
  bucket = aws_s3_bucket.static.id
  depends_on = [aws_s3_bucket_public_access_block.static]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static.arn}/*"
      }
    ]
  })
}

# Chiffrement côté serveur (sécurité)
resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Versioning activé (bonne pratique)
resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration { status = "Enabled" }
}

# Upload de la page HTML statique
resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.static.id
  key          = "index.html"
  source       = "${path.module}/../../../web/s3-static/index.html"
  content_type = "text/html"
  etag         = filemd5("${path.module}/../../../web/s3-static/index.html")
}

# Upload de l'image
resource "aws_s3_object" "image" {
  bucket       = aws_s3_bucket.static.id
  key          = "images/logo.png"
  source       = "${path.module}/../../../web/s3-static/images/logo.png"
  content_type = "image/png"
}

# ============================================================
# BUCKET S3 POUR LAMBDA (Étape 10)
# ============================================================
resource "aws_s3_bucket" "lambda_bucket" {
  bucket        = var.lambda_bucket_name
  force_destroy = true

  tags = { Name = "${var.project_name}-lambda-bucket" }
}

# Ce bucket est PRIVÉ (pas d'accès public)
resource "aws_s3_bucket_public_access_block" "lambda_bucket" {
  bucket = aws_s3_bucket.lambda_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_bucket" {
  bucket = aws_s3_bucket.lambda_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Autoriser Lambda à être déclenché par ce bucket
resource "aws_s3_bucket_notification" "lambda_trigger" {
  bucket = aws_s3_bucket.lambda_bucket.id

  lambda_function {
    lambda_function_arn = var.lambda_function_arn
    events              = ["s3:ObjectCreated:Put"]
    # Exclure output.txt pour éviter les boucles infinies
    filter_prefix       = "input/"
  }

  depends_on = [aws_s3_bucket.lambda_bucket]
}
