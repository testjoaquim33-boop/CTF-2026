output "static_bucket_name" { value = aws_s3_bucket.static.id }
output "static_website_url" { value = "http://${aws_s3_bucket_website_configuration.static.website_endpoint}" }
output "lambda_bucket_name" { value = aws_s3_bucket.lambda_bucket.id }
output "lambda_bucket_arn" { value = aws_s3_bucket.lambda_bucket.arn }
