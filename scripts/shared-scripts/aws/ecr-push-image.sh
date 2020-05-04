#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo Tags and pushes the servicee image to AWS ECR
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
echo "Checking variables"
ASSERT_VAR_SCRIPT=$( ${READLINK} -f ${SCRIPT_DIR}/../helpers/assert-variable.sh )

export PROJECT_NAME=${PROJECT_NAME:=${bamboo_PROJECT_NAME}}
source ${ASSERT_VAR_SCRIPT} PROJECT_NAME

export SERVICE_NAME=${SERVICE_NAME:=${bamboo_SERVICE_NAME}}
source ${ASSERT_VAR_SCRIPT} SERVICE_NAME

export AWS_ECR_REPO=${AWS_ECR_REPO:=${bamboo_AWS_ECR_REPO}}
source ${ASSERT_VAR_SCRIPT} AWS_ECR_REPO

export IMAGE_TAG=${IMAGE_TAG:=${bamboo_buildNumber}}

# ==============================================================================
# Script
# ==============================================================================

# Tag image
echo "Tagging docker image ${AWS_ECR_REPO}:latest"
docker tag ${PROJECT_NAME}-${SERVICE_NAME}:latest ${AWS_ECR_REPO}:latest

if [ ! -z ${IMAGE_TAG} ] && [ ${IMAGE_TAG} != "" ]; then
	echo "Tagging docker image ${AWS_ECR_REPO}:${IMAGE_TAG}"
	docker tag ${PROJECT_NAME}-${SERVICE_NAME}:latest ${AWS_ECR_REPO}:${IMAGE_TAG}
fi

# Push image
echo "Pushing docker image to AWS ECR ${AWS_ECR_REPO}:latest"
docker push ${AWS_ECR_REPO}:latest

if [ ! -z ${IMAGE_TAG} ] && [ ${IMAGE_TAG} != "" ]; then
	echo "Pushing docker image to AWS ECR ${AWS_ECR_REPO}:${IMAGE_TAG}"
	docker push ${AWS_ECR_REPO}:${IMAGE_TAG}
fi
