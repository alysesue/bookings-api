# ==============================================================================
# Script: Convert-env-to-json.sh
#
# This script converts a <env>.env file to an object
# Comments in the <env>.env file will be ignored
# ==============================================================================

#!/bin/bash
set -e

logfile=scripts/convert-env-to-json.err.log
exec 2> $logfile

# ==============================================================================
# Inputs
# ==============================================================================

DEPLOY_ENV=$1

if [[ $DEPLOY_ENV != "dev" ]] &&
	[[ $DEPLOY_ENV != "qe" ]] &&
	[[ $DEPLOY_ENV != "stg" ]] &&
	[[ $DEPLOY_ENV != "e2e" ]] &&
	[[ $DEPLOY_ENV != "local" ]] &&
	[[ $DEPLOY_ENV != "prod" ]]; then
	echo "ERROR: Invalid input. DEPLOY_ENV must be local/dev/qe/stg/e2e/prod."
	exit 1
fi

# ==============================================================================
# Script
# ==============================================================================
# Array delimiter
export IFS=$'\n'

# Get env vars
declare -a PARAMS=(`grep -v '^#' secrets/$DEPLOY_ENV.env`)

# Declare object
PARAMS_OBJECT="{}"

# Put env vars into object
for KEY_VALUE_PAIR in "${PARAMS[@]}"
do
	KEY=$(cut -d "=" -f 1 <<< $KEY_VALUE_PAIR)
	VALUE=$(cut -d "=" -f 2- <<< $KEY_VALUE_PAIR)
	VALUE="${VALUE%\"}"
	VALUE="${VALUE#\"}"
    PARAMS_OBJECT=`printf "%s\n" "$PARAMS_OBJECT" | jq --arg key $KEY --arg value $VALUE ' ."\($key)" = "\($value)"'`
done

echo $PARAMS_OBJECT
