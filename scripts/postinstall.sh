#!/bin/bash

echo ==============================================================================
echo Booking SG - Post install
echo NODE_ENV: "${NODE_ENV}"
echo ==============================================================================

if [ "${NODE_ENV}" = "production" ]
then
  echo Skipping
else
  echo Setting up husky
  husky install
fi
