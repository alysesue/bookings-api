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

# resource "aws_ssm_parameter" "test" {
#   name  = "${local.path-prefix}/TEST"
#   type  = "String"
#   value = "${data.external.static.result.TEST}"

#   overwrite = true
# }

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

resource "aws_ssm_parameter" "mol_admin_auth_forwarder_url" {
  name   = "${local.path-prefix}/MOL_ADMIN_AUTH_FORWARDER_URL"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.MOL_ADMIN_AUTH_FORWARDER_URL}"

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
  name   = "${local.path-prefix}/ENCRYPTION_KEY_BOOKINGSG_APP"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.ENCRYPTION_KEY_BOOKINGSG_APP}"
  overwrite = true
}

resource "aws_ssm_parameter" "log-queries" {
  name  = "${local.path-prefix}/LOG_QUERIES"
  type  = "String"
  value = "${data.external.static.result.LOG_QUERIES}"

  overwrite = true
}

resource "aws_ssm_parameter" "is-functional-test" {
  name  = "${local.path-prefix}/IS_FUNCTIONAL_TEST"
  type  = "String"
  value = "${data.external.static.result.IS_FUNCTIONAL_TEST}"

  overwrite = true
}

resource "aws_ssm_parameter" "is-local" {
  name  = "${local.path-prefix}/IS_LOCAL"
  type  = "String"
  value = "${data.external.static.result.IS_LOCAL}"

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-api_key_bookingsg_app" {
  name  = "${local.path-prefix}/RECAPTCHA_API_KEY_BOOKINGSG_APP"
  type  = "String"
  value = "${data.external.static.result.RECAPTCHA_API_KEY_BOOKINGSG_APP}"

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-project_id_bookingsg_app" {
  name  = "${local.path-prefix}/RECAPTCHA_PROJECT_ID_BOOKINGSG_APP"
  type  = "String"
  value = "${data.external.static.result.RECAPTCHA_PROJECT_ID_BOOKINGSG_APP}"

  overwrite = true
}

resource "aws_ssm_parameter" "recaptcha-site_key_bookingsg_app" {
  name  = "${local.path-prefix}/RECAPTCHA_SITE_KEY_BOOKINGSG_APP"
  type  = "String"
  value = "${data.external.static.result.RECAPTCHA_SITE_KEY_BOOKINGSG_APP}"

  overwrite = true
}

