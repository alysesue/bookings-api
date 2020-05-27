#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo Run jest functional tests
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

export DEBUG_PORT=${DEBUG_PORT:-7000}

export JEST_PATH=${JEST_PATH:-"./node_modules/.bin/jest"}

export JEST_CONFIG_PATH=${JEST_CONFIG_PATH:-"./jest.func.config.js"}

export TARGET_ENV=${1}
source ${ASSERT_VAR_SCRIPT} TARGET_ENV

# ==============================================================================
# Script
# ==============================================================================

if [ ${TARGET_ENV} == "prod" ]; then
	echo "Functional test can not be ran on production env."
	exit 1
elif [ ${TARGET_ENV} == "local"  ]; then
  export FUNCTIONAL_TEST_BASE_URL="http://localhost:3999"
else
	export FUNCTIONAL_TEST_BASE_URL="https://${TARGET_ENV}.momentsoflife.sg"
fi

# Run test
echo "Functional testing with jest"
${SCRIPT_DIR}/jest-test.sh --config ${JEST_CONFIG_PATH} ${@:2}
