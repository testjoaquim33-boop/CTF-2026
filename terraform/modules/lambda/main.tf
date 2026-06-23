# ============================================================
# LAMBDA — Architecture événementielle S3 (Étape 10)
# ============================================================

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../../../lambda/handler.py"
  output_path = "${path.module}/../../../lambda/handler.zip"
}

resource "aws_lambda_function" "s3_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-s3-processor"
  role             = var.iam_lambda_role_arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      BUCKET_NAME  = var.lambda_bucket_name
      OUTPUT_KEY   = "output/output.txt"
    }
  }

  tags = { Name = "${var.project_name}-lambda" }
}

# Permission pour S3 d'invoquer Lambda
resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.s3_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${var.lambda_bucket_name}"
}

# Log group CloudWatch
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.s3_processor.function_name}"
  retention_in_days = 7
}
