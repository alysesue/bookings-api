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

export SERVICE_NAME="bookingsg-api"

# ==============================================================================
# Script
# ==============================================================================

# Sync env file from AWS param store
echo "Generating service env"
${PROJECT_DIR}/node_modules/mol-lib-config/shared-scripts/aws/aws-sm-sync-env.sh ${ENV}
sleep 1

# Start node server
echo "Starting server up"
node --trace-warnings index.js
