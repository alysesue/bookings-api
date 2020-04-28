#!/bin/bash

echo ==============================================================================
echo Script: $(basename "$0")
echo Create a new mol service
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

read -p "Please enter the name of the new service (lowercase and without the mol-* prefix): " NEW_SERVICE_NAME

if [[ -z "$NEW_SERVICE_NAME" ]]; then
  echo NEW_SERVICE_NAME must be set
	exit 1
fi

read -p "Please enter the path to create the new service"$'\n'"(defaults to ../):" PATH_TO_NEW_SERVICE

if [[ -z "$PATH_TO_NEW_SERVICE" ]]; then
  PATH_TO_NEW_SERVICE="../"
else
  if [[ "${PATH_TO_NEW_SERVICE: -1}" != "/" ]];then
    PATH_TO_NEW_SERVICE="$PATH_TO_NEW_SERVICE/"
  fi
fi

# ==============================================================================
# Script
# ==============================================================================

# Set project directory
pushd ${PROJECT_DIR}

# Resolve new project dir
PATH_TO_NEW_SERVICE="$( ${READLINK} -f ${PATH_TO_NEW_SERVICE} )"
NEW_PROJECT_DIR="${PATH_TO_NEW_SERVICE}/mol-${NEW_SERVICE_NAME}"

# Make directory for new service
echo "Making directory for new service"
echo ${NEW_PROJECT_DIR}
mkdir -p ${NEW_PROJECT_DIR}

# Make a copy of this repo
echo "Copying to new service directory"
rsync -av --exclude=".git/" ${PROJECT_DIR}/ ${NEW_PROJECT_DIR}

# Replace instances of SERVICE_TEMPLATE_NAME with the new service name
echo "Replacing SERVICE_TEMPLATE_NAME with ${NEW_SERVICE_NAME}"
sed -i '' -e "s/SERVICE_TEMPLATE_NAME/${NEW_SERVICE_NAME}/g" $(find ${NEW_PROJECT_DIR} -type f ! -path '*/.git/*' ! -path '*.DS_Store*' )

pushd ${NEW_PROJECT_DIR}

rm scripts/create-new-service.sh
git init

popd

# Return to invocation dir
popd
