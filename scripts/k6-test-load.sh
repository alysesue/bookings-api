#!/bin/sh
k6 run ./__tests__/load/src/index.ts -e LOAD_TEST_BASE_URL=https://www.dev.booking.gov.sg -e TARGET_ENV=dev -o csv=load_test.csv
