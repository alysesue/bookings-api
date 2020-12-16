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

resource "aws_ssm_parameter" "recaptcha-key_bookingsg_app" {
  name   = "${local.path-prefix}/RECAPTCHA_KEY_BOOKINGSG_APP"
  type   = "SecureString"
  key_id = "${data.aws_kms_alias.kms-ssm-alias-app.name}"
  value  = "${data.external.static.result.RECAPTCHA_KEY_BOOKINGSG_APP}"

  overwrite = true
}
