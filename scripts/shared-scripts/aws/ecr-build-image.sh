#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo Builds the docker image from a packaged docker tarball
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

# Path to the packaged tarball to be published
PACKAGE_PATH=$1
source ${ASSERT_VAR_SCRIPT} PACKAGE_PATH

export PROJECT_NAME=${PROJECT_NAME:=${bamboo_PROJECT_NAME}}
source ${ASSERT_VAR_SCRIPT} PROJECT_NAME

export SERVICE_NAME=${SERVICE_NAME:=${bamboo_SERVICE_NAME}}
source ${ASSERT_VAR_SCRIPT} SERVICE_NAME

# ==============================================================================
# Script
# ==============================================================================

# Resolve package path
PACKAGE_PATH=$( ${READLINK} -f ${PACKAGE_PATH} )

# Prepare image directory
echo "Preparing temp package folder"
rm -rf ./build_image
mkdir -p ./build_image
cd build_image

# Extract package
echo "Extracting package"
tar -C $( pwd ) --strip-components=1 -xvzf ${PACKAGE_PATH}

# Build image
echo "Building docker image"
docker build -t ${PROJECT_NAME}-${SERVICE_NAME} -f ./Dockerfile .

# Clean up image directory
cd ..
rm -rf ./build_image
