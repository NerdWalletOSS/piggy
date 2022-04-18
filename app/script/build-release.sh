#!/bin/bash
yarn install-patch
yarn forwarder:build
rm public/preload-manifest.js
rm public/preload-module-*.js
node script/collect-preload-scripts.js
yarn build
yarn package
