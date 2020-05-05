#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo Updates the AWS ECR manifest
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

export IMAGE_TAG=${IMAGE_TAG:=${bamboo_buildNumber}}
export IMAGE_TAG=${IMAGE_TAG:="latest"}

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

# Retrieve manifest
echo "Retrieving image manifest"

RESPONSE_MANIFEST=$(aws ecr batch-get-image \
--repository-name ${PROJECT_NAME}-${SERVICE_NAME} \
--image-ids imageTag=${IMAGE_TAG} \
--query 'images[].imageManifest' \
--output text)

echo "Retrieved manifest: \n${RESPONSE_MANIFEST}"

# Update manifest
echo "Updating manifest for env: ${ENV_NAME}"

set +e
RESPONSE_UPDATE_MANIFEST=$(aws ecr put-image \
--repository-name ${PROJECT_NAME}-${SERVICE_NAME} \
--image-tag ${ENV_NAME} \
--image-manifest "${RESPONSE_MANIFEST}" \
--output text 2>&1 1>/dev/null)
set -e

echo "Update manifest response: \n${RESPONSE_UPDATE_MANIFEST}"

# Get response code
RESPONSE_CODE=$?
if [[ ${RESPONSE_CODE} != 0 ]]; then
	echo -e "\e[41m${RESPONSE_UPDATE_MANIFEST}"
	if [[ ${RESPONSE_UPDATE_MANIFEST} == *"ImageAlreadyExistsException"* ]]; then
		# Exit with no errors if the image has already been pushed
		exit 0
	fi
fi

exit ${RESPONSE_CODE}
