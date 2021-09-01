#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo This script is meant to be called by the dockerfile, to begin running the service
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
PROJECT_DIR=$( cd ${SCRIPT_DIR} && cd .. && pwd )

# ==============================================================================
# Inputs
# ==============================================================================

# Variables
echo "Checking variables"
ASSERT_VAR_SCRIPT="${PROJECT_DIR}/node_modules/mol-lib-config/shared-scripts/helpers/assert-variable.sh"

export ENV=$1					# Injected by terraform
source ${ASSERT_VAR_SCRIPT} ENV

export PROJECT_NAME=${PROJECT_NAME:="bsg"}
source ${ASSERT_VAR_SCRIPT} PROJECT_NAME

export AWS_DEFAULT_REGION="ap-southeast-1"
export SERVICE_NAME="api"

# ==============================================================================
# Script
# ==============================================================================

# Sync env file from AWS param store
echo "Setting up .env file for ${ENV} environment"

path_prefix=/${PROJECT_NAME}/${ENV}/service/${SERVICE_NAME}/app/
echo "Fetching parameters for $path_prefix from AWS"
aws_params=$(aws ssm get-parameters-by-path --with-decryption --recursive --region ap-southeast-1 --path $path_prefix)
truncate -s 0 .env

# Write parameters into an .env file
echo "Writing parameters into a .env file"
for k in $(jq '.Parameters | keys | .[]' <<< "${aws_params}"); do
    parameter=$(jq -r ".Parameters[$k]" <<< "${aws_params}");
    key=$(jq -r '.Name' <<< "$parameter");
    result=$(jq -r '.Value' <<< "$parameter");
	echo "$key" "=" ${#result} | sed -e s,${path_prefix},,
    printf "%s=%s\n" "$key" "$result" | sed -e s,${path_prefix},, >> .env
done

echo ".env file for ${ENV} environment is ready"

# Generate APM config file
# echo "Generating APM config file"
# source ${PROJECT_DIR}/node_modules/mol-lib-config/shared-scripts/apm/index.sh ${PROJECT_DIR}/elastic-apm-config.js ${PROJECT_DIR}/.env
# source ${ASSERT_VAR_SCRIPT} ELASTIC_APM_CONFIG_FILE

echo "Env from terraform"
echo ${ENV}

# Start node server
echo "Starting server up"
node --trace-warnings index.js
