# Fixed path for each service
# Please do not change
locals {
  path-prefix = "/${var.project}/${terraform.workspace}/bookingsg-api"
}

# Keys for encryption
## For general secrets (e.g. static keys)
data "aws_kms_alias" "kms-ssm-alias-app" {
  name = "alias/${var.project}-ssm-app"
}

# Default variables and settings
variable "project" {
  default = "mol"
}

provider "aws" {
  region = "ap-southeast-1"
}

terraform {
  backend "s3" {
    region = "ap-southeast-1"
  }
}

