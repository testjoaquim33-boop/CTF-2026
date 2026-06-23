output "admin_group_name" { value = aws_iam_group.admin.name }
output "dev_group_name" { value = aws_iam_group.dev.name }
output "dba_group_name" { value = aws_iam_group.dba.name }
output "ec2_instance_profile_name" { value = aws_iam_instance_profile.ec2_profile.name }
output "lambda_role_arn" { value = aws_iam_role.lambda_role.arn }
output "imds_test_profile_name" { value = aws_iam_instance_profile.imds_test_profile.name }
