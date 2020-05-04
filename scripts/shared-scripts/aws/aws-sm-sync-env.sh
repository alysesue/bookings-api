#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo This script syncs and generates a .env file from the AWS prarameter store
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

export ENV=$1	# local, dev, qe, stg, prod
source ${ASSERT_VAR_SCRIPT} ENV

export SERVICE_NAME
source ${ASSERT_VAR_SCRIPT} SERVICE_NAME

# Not required if credentials are already being injected by AWS
export CREDENTIALS_REPO_DIR=${CREDENTIALS_REPO_DIR:="$( cd .. && pwd )/mol-credentials"}

# ==============================================================================
# Script
# ==============================================================================

# If no credentials has been injected by AWS, set from it from the credentials file inside CREDENTIALS_REPO_DIR
if [[ -z ${AWS_CONTAINER_CREDENTIALS_RELATIVE_URI} ]]; then
	# Resolve credentials file path
	CREDENTIALS_FILE_PATH="$( ${READLINK} -f ${CREDENTIALS_REPO_DIR} )/awscli/.credentials"

	# Ensure that the repo and credentials file exists
	if [[ ! -d "${CREDENTIALS_REPO_DIR}" ]] || [[ ! -f "${CREDENTIALS_FILE_PATH}" ]]; then
		echo "${CREDENTIALS_FILE_PATH} doesn't exist. please clone it or provide the correct dir"
		exit 1
	fi

	# Update the credentials repo
	pushd "${CREDENTIALS_REPO_DIR}"
	echo "Pulling the latest credentials"
	set +e	# Silence exit error
	GIT_PULL_RESULT="$( echo $(git pull -r ) )"
	set -e
	popd

	# Set env variables with credentials file
	echo "Setting AWS credentials into env vars"
	set -a
	. ${CREDENTIALS_FILE_PATH}
	set +a
fi

# Retrieve parameters from AWS param store
echo "Fetching parameters for ${ENV} environment from AWS"
export AWS_DEFAULT_REGION="ap-southeast-1"
AWS_PARAMS=$(aws ssm get-parameters-by-path --with-decryption --recursive --region ap-southeast-1 --path "/mol/${ENV}/${SERVICE_NAME}/")
cp /dev/null .env

# Write parameters into an .env file
echo "Writing parameters into a .env file"
for k in $(jq '.Parameters | keys | .[]' <<< "${AWS_PARAMS}"); do
    parameter=$(jq -r ".Parameters[$k]" <<< "${AWS_PARAMS}");
    key=$(jq -r '.Name' <<< "$parameter");
    result=$(jq -r '.Value' <<< "$parameter");
	echo "$key" "=" ${#result} | sed -e s,/mol/$ENV/${SERVICE_NAME}/,,
    printf "%s=%s\n" "$key" "$result" | sed -e s,/mol/${ENV}/${SERVICE_NAME}/,, >> .env
done

echo ".env file for ${ENV} environment is ready"
