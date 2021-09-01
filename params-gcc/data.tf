data "aws_kms_alias" "ssm-app" {
  name = format("alias/%s-%s-%s", var.internal-code, terraform.workspace, "ssm-app")
}

data "external" "static" {
  program = ["bash", "scripts/convert-env-to-json.sh", terraform.workspace]
}
