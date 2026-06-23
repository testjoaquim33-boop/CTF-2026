output "bastion_public_ip" { value = aws_instance.bastion.public_ip }
output "bastion_instance_id" { value = aws_instance.bastion.id }
output "web1_private_ip" { value = aws_instance.web1.private_ip }
output "web1_instance_id" { value = aws_instance.web1.id }
output "web2_private_ip" { value = aws_instance.web2.private_ip }
output "web2_instance_id" { value = aws_instance.web2.id }
output "db_private_ip" { value = aws_instance.db.private_ip }
output "db_instance_id" { value = aws_instance.db.id }
