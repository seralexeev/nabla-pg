#!/bin/bash

set -e

rm -rf dist
tsc -p tsconfig.build.json
tsc-alias
cp package.json dist/
cp -r bin dist/

# mv dist/pg/src/* dist/pg/
# rm -rf dist/pg/src

# mv dist/pg-core/src/* dist/pg-core/
# rm -rf dist/pg-core/src

# mv dist/utils/src/* dist/utils/
# rm -rf dist/utils/src

cp dist/pg/src/index.js dist/pg/src/index.d.ts dist/

sed -i '' 's!\'"'"'!"!g' dist/index.d.ts
sed -i '' 's!"./!"./pg/src/!g' dist/index.js dist/index.d.ts
sed -i '' 's!"../../!"./!g' dist/index.js dist/index.d.ts
