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


resource "aws_ssm_parameter" "test" {
  name  = "${local.path-prefix}/TEST"
  type  = "String"
  value = "${data.external.static.result.TEST}"

  overwrite = true
}

