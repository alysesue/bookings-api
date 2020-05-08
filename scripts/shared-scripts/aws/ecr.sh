#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo This script is meant to be called by the bamboo CI
echo This script publishes the a packaged docker tarball to AWS
echo
echo It has the following assumptions:
echo 1. The packaged distribution should have everything needed to build a docker image
echo 2. The required environment variables have been set
echo ==============================================================================

# ==============================================================================
# Setup
# ==============================================================================

# Exit immediately if a command exits with a non-zero status.
set -e

# OS settings
if [ "$(uname)" = "Darwin" ]; then
	[ -z "$( brew ls --versions findutils )" ] && brew install findutils
	[ -z "$( brew ls --versions coreutils )" ] && brew install coreutils
	READLINK="greadlink"
	XARGS="gxargs"
else
	READLINK="readlink"
	XARGS="xargs"
fi

SCRIPT_PATH=$( ${READLINK} -f $0 )
SCRIPT_DIR=$( dirname $( ${READLINK} -f $0 ) )

# ==============================================================================
# Inputs
# ==============================================================================

# Variables
echo "[ECR] Checking variables"
ASSERT_VAR_SCRIPT=$( ${READLINK} -f ${SCRIPT_DIR}/../helpers/assert-variable.sh )

export PACKAGE_PATH=$1
source ${ASSERT_VAR_SCRIPT} PACKAGE_PATH

# $2 onwards are the environments you want to deploy to, but at least 1 is required
export ENV_NAME=$2
source ${ASSERT_VAR_SCRIPT} ENV_NAME

export AWS_ECR_REPO=${AWS_ECR_REPO:=${bamboo_AWS_ECR_REPO}}
source ${ASSERT_VAR_SCRIPT} AWS_ECR_REPO

# Used for AWS login
export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:=${bamboo_AWS_ACCESS_KEY_ID}}
source ${ASSERT_VAR_SCRIPT} AWS_ACCESS_KEY_ID

export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:=${bamboo_AWS_SECRET_ACCESS_KEY}}
source ${ASSERT_VAR_SCRIPT} AWS_SECRET_ACCESS_KEY

export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:=${bamboo_AWS_DEFAULT_REGION}}
source ${ASSERT_VAR_SCRIPT} AWS_DEFAULT_REGION

# ==============================================================================
# Script
# ==============================================================================

# Build image
echo "[ECR] Building image"
${SCRIPT_DIR}/ecr-build-image.sh ${PACKAGE_PATH}

# Log in to AWS ECR
echo "[ECR] Logging in to AWS ECR"
eval $(aws ecr get-login --no-include-email)

# Tag and push image
echo "[ECR] Running push image"
${SCRIPT_DIR}/ecr-push-image.sh

# Update services
argc=$#
argv=("$@")
for (( i=1; i<argc; i++ )); do
	export ENV_NAME=${argv[i]}
	echo "[ECR] Running update manifest and service for ${ENV_NAME}"
	${SCRIPT_DIR}/ecr-update-manifest.sh
	${SCRIPT_DIR}/ecr-update-service.sh
done

# Log out of AWS ECR
echo "[ECR] Logging out of AWS ECR"
docker logout ${AWS_ECR_REPO}
