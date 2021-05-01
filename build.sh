#!/bin/bash

set -e
echo building $1

rm -rf dist
tsc
tsc-alias
cp package.json dist/

if [ -e bin ]; then
    cp -r bin dist/
fi

cp dist/$1/src/index.js dist/$1/src/index.d.ts dist/

sed -i '' 's!\'"'"'!"!g' dist/index.d.ts
sed -i '' 's!"./!"./'$1'/src/!g' dist/index.js dist/index.d.ts
sed -i '' 's!"../../!"./!g' dist/index.js dist/index.d.ts
