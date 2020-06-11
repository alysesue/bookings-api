#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo Builds and prepares the distribution
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

export BUILD_ENV=${1:-development}	# development or production only
source ${ASSERT_VAR_SCRIPT} BUILD_ENV

# ==============================================================================
# Script
# ==============================================================================

# Set project directory
pushd ${PROJECT_DIR}

# Build and pack
echo "Generate TSOA routes"
./node_modules/.bin/tsoa routes

# Build and pack
echo "Webpacking"
export TS_NODE_PROJECT=./node_modules/mol-lib-config/shared-config/script.tsconfig.json
./node_modules/.bin/webpack-cli

echo 'Swaggering'
./node_modules/.bin/tsoa swagger --yaml
pushd dist
npm shrinkwrap
npm pack
popd

echo "run migrations"

./node_modules/.bin/ts-node --project tsconfig.json ./node_modules/.bin/typeorm schema:sync
./node_modules/.bin/ts-node --project tsconfig.json ./node_modules/.bin/typeorm migration:run

# Return to invocation dir
popd
