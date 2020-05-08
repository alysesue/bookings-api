#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo Updates the target env fargate cluster to run the latest service image
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

export ENV_NAME # dev, qe, stg, prod
source ${ASSERT_VAR_SCRIPT} ENV_NAME

export PROJECT_NAME=${PROJECT_NAME:=${bamboo_PROJECT_NAME}}
source ${ASSERT_VAR_SCRIPT} PROJECT_NAME

export SERVICE_NAME=${SERVICE_NAME:=${bamboo_SERVICE_NAME}}
source ${ASSERT_VAR_SCRIPT} SERVICE_NAME

# ==============================================================================
# Script
# ==============================================================================

# Check for invalid env
if [ ${ENV_NAME} != "dev" ] &&
	[ ${ENV_NAME} != "qe" ] &&
	[ ${ENV_NAME} != "stg" ] &&
	[ ${ENV_NAME} != "prod" ]; then
	echo "ENV_NAME must be dev/qe/stg/prod" >>/dev/stderr
	exit 1
fi

# Update cluster service
echo "Updating AWS cluster service"
aws ecs update-service \
    --cluster ${PROJECT_NAME}-${ENV_NAME}-cluster \
    --service ${PROJECT_NAME}-${ENV_NAME}-${SERVICE_NAME}-service \
    --force-new-deployment | grep -vq "failed to launch a task with"

echo $?
