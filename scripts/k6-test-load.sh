#!/bin/sh
function main(){
    TARGET_ENV="dev"
    LOAD_TEST_PATH="./__tests__/load/src/index.ts" \
    ./node_modules/mol-lib-config/shared-scripts/k6-test-load.sh ${TARGET_ENV}
}
main
