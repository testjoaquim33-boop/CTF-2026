# ============================================================
# APPLICATION LOAD BALANCER — Répartition sur 2 AZs (Étape 3)
# ============================================================

resource "aws_lb" "web" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.sg_alb_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = { Name = "${var.project_name}-alb" }
}

# ---- Target Group ----
resource "aws_lb_target_group" "web" {
  name     = "${var.project_name}-tg-web"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    protocol            = "HTTP"
  }

  tags = { Name = "${var.project_name}-tg-web" }
}

# ---- Listener HTTP ----
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.web.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}
