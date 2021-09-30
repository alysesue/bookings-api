locals {
  path-prefix = format("/%s/%s/service/%s/app", var.internal-code, terraform.workspace, var.service-name)
  tags = {
    Agency-code   = var.agency-code
    Project-code  = var.project-code
    Internal-code = var.internal-code
    Environment   = terraform.workspace
    Zone          = var.zone
    Service-name  = var.service-name
  }
}

# =============================================================================
# AWS
# =============================================================================

resource "aws_ssm_parameter" "node-env" {
  name  = format("%s/%s", local.path-prefix, "NODE_ENV")
  type  = "String"
  value = data.external.static.result.NODE_ENV

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "NODE_ENV")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "port" {
  name  = format("%s/%s", local.path-prefix, "PORT")
  type  = "String"
  value = data.external.static.result.PORT

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "PORT")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "bookingsg-db_instance" {
  name  = format("%s/%s", local.path-prefix, "DB_INSTANCE")
  type  = "String"
  value = data.external.static.result.DB_INSTANCE

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "DB_INSTANCE")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "bookingsg-db_username" {
  name  = format("%s/%s", local.path-prefix, "DB_USERNAME")
  type  = "String"
  value = data.external.static.result.DB_USERNAME

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "DB_USERNAME")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "db-password" {
  name   = format("%s/%s", local.path-prefix, "DB_PASSWORD")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.DB_PASSWORD

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "DB_PASSWORD")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "mq-port" {
  name  = format("%s/%s", local.path-prefix, "MQ_PORT")
  type  = "String"
  value = data.external.static.result.MQ_PORT

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "MQ_PORT")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "mq-transport" {
  name  = format("%s/%s", local.path-prefix, "MQ_TRANSPORT")
  type  = "String"
  value = data.external.static.result.MQ_TRANSPORT

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "MQ_TRANSPORT")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "mol_admin_auth_forwarder_url" {
  name   = format("%s/%s", local.path-prefix, "MOL_ADMIN_AUTH_FORWARDER_URL")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.MOL_ADMIN_AUTH_FORWARDER_URL

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "MOL_ADMIN_AUTH_FORWARDER_URL")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "mol_notification_url" {
  name   = format("%s/%s", local.path-prefix, "MOL_NOTIFICATION_URL")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.MOL_NOTIFICATION_URL

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "MOL_NOTIFICATION_URL")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "bookingsg_hashid_salt" {
  name   = format("%s/%s", local.path-prefix, "BOOKINGSG_HASHID_SALT")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.BOOKINGSG_HASHID_SALT

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "BOOKINGSG_HASHID_SALT")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-key_bookingsg_app" {
  name   = format("%s/%s", local.path-prefix, "RECAPTCHA_KEY_BOOKINGSG_APP")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.RECAPTCHA_KEY_BOOKINGSG_APP

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "RECAPTCHA_KEY_BOOKINGSG_APP")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "encryption-key_bookingsg_app" {
  name   = format("%s/%s", local.path-prefix, "ENCRYPTION_KEY_BOOKINGSG_APP")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.ENCRYPTION_KEY_BOOKINGSG_APP
  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "ENCRYPTION_KEY_BOOKINGSG_APP")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "log-queries" {
  name  = format("%s/%s", local.path-prefix, "LOG_QUERIES")
  type  = "String"
  value = data.external.static.result.LOG_QUERIES

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "LOG_QUERIES")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "is-automated-test" {
  name  = format("%s/%s", local.path-prefix, "IS_AUTOMATED_TEST")
  type  = "String"
  value = data.external.static.result.IS_AUTOMATED_TEST

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "IS_AUTOMATED_TEST")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "is-local" {
  name  = format("%s/%s", local.path-prefix, "IS_LOCAL")
  type  = "String"
  value = data.external.static.result.IS_LOCAL

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "IS_LOCAL")
  })

  overwrite = true
}
resource "aws_ssm_parameter" "recaptcha-site_key_bookingsg_app" {
  name   = format("%s/%s", local.path-prefix, "RECAPTCHA_SITE_KEY_BOOKINGSG_APP")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.RECAPTCHA_SITE_KEY_BOOKINGSG_APP

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "RECAPTCHA_SITE_KEY_BOOKINGSG_APP")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-project_id_bookingsg_app" {
  name   = format("%s/%s", local.path-prefix, "RECAPTCHA_PROJECT_ID_BOOKINGSG_APP")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.RECAPTCHA_PROJECT_ID_BOOKINGSG_APP

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "RECAPTCHA_PROJECT_ID_BOOKINGSG_APP")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-api_key_bookingsg_app" {
  name   = format("%s/%s", local.path-prefix, "RECAPTCHA_API_KEY_BOOKINGSG_APP")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.RECAPTCHA_API_KEY_BOOKINGSG_APP

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "RECAPTCHA_API_KEY_BOOKINGSG_APP")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "csrf_secret" {
  name   = format("%s/%s", local.path-prefix, "CSRF_SECRET")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.CSRF_SECRET

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "CSRF_SECRET")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "booking_env" {
  name  = format("%s/%s", local.path-prefix, "BOOKING_ENV")
  type  = "String"
  value = data.external.static.result.BOOKING_ENV

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "BOOKING_ENV")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "access_control_allow_origin" {
  name  = format("%s/%s", local.path-prefix, "ACCESS_CONTROL_ALLOW_ORIGIN")
  type  = "String"
  value = data.external.static.result.ACCESS_CONTROL_ALLOW_ORIGIN

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "ACCESS_CONTROL_ALLOW_ORIGIN")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-host" {
  name  = format("%s/%s", local.path-prefix, "SMTP_HOST")
  type  = "String"
  value = data.external.static.result.SMTP_HOST

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "SMTP_HOST")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-port" {
  name  = format("%s/%s", local.path-prefix, "SMTP_PORT")
  type  = "String"
  value = data.external.static.result.SMTP_PORT

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "SMTP_PORT")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-secure" {
  name  = format("%s/%s", local.path-prefix, "SMTP_SECURE")
  type  = "String"
  value = data.external.static.result.SMTP_SECURE

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "SMTP_SECURE")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-use-auth" {
  name  = format("%s/%s", local.path-prefix, "SMTP_USE_AUTH")
  type  = "String"
  value = data.external.static.result.SMTP_USE_AUTH

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "SMTP_USE_AUTH")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "mol-sender-email" {
  name  = format("%s/%s", local.path-prefix, "MOL_SENDER_EMAIL")
  type  = "String"
  value = data.external.static.result.MOL_SENDER_EMAIL

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "MOL_SENDER_EMAIL")
  })

  overwrite = true
}
resource "aws_ssm_parameter" "mol-routes_myinfo" {
  name   = format("%s/%s", local.path-prefix, "MOL_ROUTES_MYINFO")
  type   = "SecureString"
  key_id = data.aws_kms_alias.ssm-app.name
  value  = data.external.static.result.MOL_ROUTES_MYINFO

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "MOL_ROUTES_MYINFO")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "otp-enabled" {
  name  = format("%s/%s", local.path-prefix, "OTP_ENABLED")
  type  = "String"
  value = data.external.static.result.OTP_ENABLED

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "OTP_ENABLED")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "app-url" {
  name  = format("%s/%s", local.path-prefix, "APP_URL")
  type  = "String"
  value = data.external.static.result.APP_URL

  tags = merge(local.tags, {
    Name = format("%s/%s", local.path-prefix, "APP_URL")
  })

  overwrite = true
}

resource "aws_ssm_parameter" "sms-enabled" {
  name  = "${local.path-prefix}/SMS_ENABLED"
  type  = "String"
  value = "${data.external.static.result.SMS_ENABLED}"

  overwrite = true
}
