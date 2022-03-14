#!/bin/bash
pushd node_modules/adbkit
rm src 2> /dev/null
ln -s lib src 2> /dev/null
popd

pushd node_modules/adbkit-logcat
rm src 2> /dev/null
ln -s lib src 2> /dev/null
popd

pushd node_modules/adbkit-monkey
rm src 2> /dev/null
ln -s lib src 2> /dev/null
popd
