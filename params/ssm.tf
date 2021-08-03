data "external" "static" {
  program = ["bash", "scripts/convert-env-to-json.sh", "${terraform.workspace}"]
}

# Parameters

# resource "aws_ssm_parameter" "example" {
#   # Remove only when variable is in prod
#   count = "${terraform.workspace == "prod" ? 0 : 1}"

#   name  = "${local.path-prefix}/EXAMPLE"
#   type  = "String"
#   value = "${data.external.static.result.EXAMPLE}"
# }

resource "aws_ssm_parameter" "node-env" {
  name  = "${local.path-prefix}/NODE_ENV"
  type  = "String"
  value = "${data.external.static.result.NODE_ENV}"

  overwrite = true
}

resource "aws_ssm_parameter" "port" {
  name  = "${local.path-prefix}/PORT"
  type  = "String"
  value = "${data.external.static.result.PORT}"

  overwrite = true
}

resource "aws_ssm_parameter" "bookingsg-db_port" {
  name  = "${local.path-prefix}/BOOKINGSG_DB_PORT"
  type  = "String"
  value = "${data.external.static.result.BOOKINGSG_DB_PORT}"

  overwrite = true
}

resource "aws_ssm_parameter" "bookingsg-db_host" {
  name  = "${local.path-prefix}/BOOKINGSG_DB_HOST"
  type  = "String"
  value = "${data.external.static.result.BOOKINGSG_DB_HOST}"

  overwrite = true
}

resource "aws_ssm_parameter" "bookingsg-db_instance" {
  name  = "${local.path-prefix}/BOOKINGSG_DB_INSTANCE"
  type  = "String"
  value = "${data.external.static.result.BOOKINGSG_DB_INSTANCE}"

  overwrite = true
}

resource "aws_ssm_parameter" "bookingsg-db_username" {
  name  = "${local.path-prefix}/BOOKINGSG_DB_USERNAME"
  type  = "String"
  value = "${data.external.static.result.BOOKINGSG_DB_USERNAME}"

  overwrite = true
}

resource "aws_ssm_parameter" "db-password_bookingsg_app" {
  name   = "${local.path-prefix}/DB_PASSWORD_BOOKINGSG_APP"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.DB_PASSWORD_BOOKINGSG_APP}"

  overwrite = true
}

resource "aws_ssm_parameter" "mq-host_std" {
  name  = "${local.path-prefix}/MQ_HOST_STD"
  type  = "String"
  value = "${data.external.static.result.MQ_HOST_STD}"

  overwrite = true
}

resource "aws_ssm_parameter" "mq-host_failover" {
  name  = "${local.path-prefix}/MQ_HOST_FAILOVER"
  type  = "String"
  value = "${data.external.static.result.MQ_HOST_FAILOVER}"

  overwrite = true
}

resource "aws_ssm_parameter" "mq-port" {
  name  = "${local.path-prefix}/MQ_PORT"
  type  = "String"
  value = "${data.external.static.result.MQ_PORT}"

  overwrite = true
}

resource "aws_ssm_parameter" "mq-transport" {
  name  = "${local.path-prefix}/MQ_TRANSPORT"
  type  = "String"
  value = "${data.external.static.result.MQ_TRANSPORT}"

  overwrite = true
}

resource "aws_ssm_parameter" "mq-username" {
  name  = "${local.path-prefix}/MQ_USERNAME"
  type  = "String"
  value = "${data.external.static.result.MQ_USERNAME}"

  overwrite = true
}

resource "aws_ssm_parameter" "mq-password" {
  name   = "${local.path-prefix}/MQ_PASSWORD"
  type   = "String"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.MQ_PASSWORD}"

  overwrite = true
}

resource "aws_ssm_parameter" "mol_admin_auth_forwarder_url" {
  name   = "${local.path-prefix}/MOL_ADMIN_AUTH_FORWARDER_URL"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.MOL_ADMIN_AUTH_FORWARDER_URL}"

  overwrite = true
}

resource "aws_ssm_parameter" "mol_notification_url" {
  name   = "${local.path-prefix}/MOL_NOTIFICATION_URL"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.MOL_NOTIFICATION_URL}"

  overwrite = true
}

resource "aws_ssm_parameter" "bookingsg_hashid_salt" {
  name   = "${local.path-prefix}/BOOKINGSG_HASHID_SALT"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.BOOKINGSG_HASHID_SALT}"

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-key_bookingsg_app" {
  name   = "${local.path-prefix}/RECAPTCHA_KEY_BOOKINGSG_APP"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.RECAPTCHA_KEY_BOOKINGSG_APP}"

  overwrite = true
}

resource "aws_ssm_parameter" "encryption-key_bookingsg_app" {
  name      = "${local.path-prefix}/ENCRYPTION_KEY_BOOKINGSG_APP"
  type      = "SecureString"
  key_id    = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value     = "${data.external.static.result.ENCRYPTION_KEY_BOOKINGSG_APP}"
  overwrite = true
}

resource "aws_ssm_parameter" "log-queries" {
  name  = "${local.path-prefix}/LOG_QUERIES"
  type  = "String"
  value = "${data.external.static.result.LOG_QUERIES}"

  overwrite = true
}

resource "aws_ssm_parameter" "is-automated-test" {
  name  = "${local.path-prefix}/IS_AUTOMATED_TEST"
  type  = "String"
  value = "${data.external.static.result.IS_AUTOMATED_TEST}"

  overwrite = true
}

resource "aws_ssm_parameter" "is-local" {
  name  = "${local.path-prefix}/IS_LOCAL"
  type  = "String"
  value = "${data.external.static.result.IS_LOCAL}"

  overwrite = true
}
resource "aws_ssm_parameter" "recaptcha-site_key_bookingsg_app" {
  name   = "${local.path-prefix}/RECAPTCHA_SITE_KEY_BOOKINGSG_APP"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.RECAPTCHA_SITE_KEY_BOOKINGSG_APP}"

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-project_id_bookingsg_app" {
  name   = "${local.path-prefix}/RECAPTCHA_PROJECT_ID_BOOKINGSG_APP"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.RECAPTCHA_PROJECT_ID_BOOKINGSG_APP}"

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-api_key_bookingsg_app" {
  name   = "${local.path-prefix}/RECAPTCHA_API_KEY_BOOKINGSG_APP"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.RECAPTCHA_API_KEY_BOOKINGSG_APP}"

  overwrite = true
}

resource "aws_ssm_parameter" "csrf_secret" {
  name   = "${local.path-prefix}/CSRF_SECRET"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.CSRF_SECRET}"

  overwrite = true
}

resource "aws_ssm_parameter" "booking_env" {
  name  = "${local.path-prefix}/BOOKING_ENV"
  type  = "String"
  value = "${data.external.static.result.BOOKING_ENV}"

  overwrite = true
}

resource "aws_ssm_parameter" "access_control_allow_origin" {
  name  = "${local.path-prefix}/ACCESS_CONTROL_ALLOW_ORIGIN"
  type  = "String"
  value = "${data.external.static.result.ACCESS_CONTROL_ALLOW_ORIGIN}"

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-host" {
  name  = "${local.path-prefix}/SMTP_HOST"
  type  = "String"
  value = "${data.external.static.result.SMTP_HOST}"

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-port" {
  name  = "${local.path-prefix}/SMTP_PORT"
  type  = "String"
  value = "${data.external.static.result.SMTP_PORT}"

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-secure" {
  name  = "${local.path-prefix}/SMTP_SECURE"
  type  = "String"
  value = "${data.external.static.result.SMTP_SECURE}"

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-use-auth" {
  name  = "${local.path-prefix}/SMTP_USE_AUTH"
  type  = "String"
  value = "${data.external.static.result.SMTP_USE_AUTH}"

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-auth-username" {
  name  = "${local.path-prefix}/SMTP_AUTH_USERNAME"
  type  = "String"
  value = "${data.external.static.result.SMTP_AUTH_USERNAME}"

  overwrite = true
}

resource "aws_ssm_parameter" "smtp-auth-password" {
  name   = "${local.path-prefix}/SMTP_AUTH_PASSWORD"
  type   = "SecureString"
  value  = "${data.external.static.result.SMTP_AUTH_PASSWORD}"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"

  overwrite = true
}

resource "aws_ssm_parameter" "mol-sender-email" {
  name  = "${local.path-prefix}/MOL_SENDER_EMAIL"
  type  = "String"
  value = "${data.external.static.result.MOL_SENDER_EMAIL}"

  overwrite = true
}
resource "aws_ssm_parameter" "mol-routes_myinfo" {
  name  = "${local.path-prefix}/MOL_ROUTES_MYINFO"
  type  = "SecureString"
  key_id  = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value = "${data.external.static.result.MOL_ROUTES_MYINFO}"

  overwrite = true
}

resource "aws_ssm_parameter" "otp-enabled" {
  name  = "${local.path-prefix}/OTP_ENABLED"
  type  = "String"
  value = "${data.external.static.result.OTP_ENABLED}"

  overwrite = true
}

resource "aws_ssm_parameter" "app-url" {
  name  = "${local.path-prefix}/APP_URL"
  type  = "String"
  value = "${data.external.static.result.APP_URL}"

  overwrite = true
}

