#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo Run k6 load tests
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
ASSERT_VAR_SCRIPT=$( ${READLINK} -f ${SCRIPT_DIR}/helpers/assert-variable.sh )

export WEBPACK_PATH=${WEBPACK_PATH:-"./node_modules/.bin/webpack"}

export WEBPACK_CONFIG_PATH=${WEBPACK_CONFIG_PATH:-"./webpack.load.config.ts"}

export LOAD_TEST_PATH=${LOAD_TEST_PATH:-"./__tests__/load/dist/index.js"}

export TARGET_ENV=${1}
source ${ASSERT_VAR_SCRIPT} TARGET_ENV

# ==============================================================================
# Script
# ==============================================================================

if [ ${TARGET_ENV} == "prod" ]; then
	echo "Load test can not be ran on production env."
	exit 1
else
	export LOAD_TEST_BASE_URL="https://${TARGET_ENV}.momentsoflife.sg"
fi

# Build test
echo "Webpacking"
export TS_NODE_PROJECT=${SCRIPT_DIR}/../shared-config/script.tsconfig.json
${WEBPACK_PATH} --config ${WEBPACK_CONFIG_PATH}

# Run test
echo "Load testing with k6"
k6 run ${LOAD_TEST_PATH} -e LOAD_TEST_BASE_URL=${LOAD_TEST_BASE_URL} ${@:2}
