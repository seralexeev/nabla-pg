#!/bin/bash

set -e

rm -rf dist
tsc -p tsconfig.build.json
tsc-alias
cp package.json dist/

mv dist/pg/index.js dist/pg/index.d.ts ./dist
sed -i '' 's!./src!./pg/src!g' dist/index.js dist/index.d.ts
# sed -i '' 's!./src!./pg/src!g' 
