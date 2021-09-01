# Default variables and settings
variable "service-name" {
  default = "api"
}

variable "agency-code" {
  default = "govtech"
}

variable "project-code" {
  default = "lifesg"
}

variable "internal-code" {
  default = "bsg"
}

variable "zone" {
  default = "ez"
}

# providers
provider "aws" {
  region = "ap-southeast-1"
}

terraform {
  backend "s3" {
    region = "ap-southeast-1"
  }
}

