#!/bin/bash

if [ -d "node_modules/adbkit" ]; then
  pushd node_modules/adbkit
  rm src 2> /dev/null
  ln -s lib src 2> /dev/null
  popd
fi

if [ -d "node_modules/adbkit-logcat" ]; then
  pushd node_modules/adbkit-logcat
  rm src 2> /dev/null
  ln -s lib src 2> /dev/null
  popd
fi

if [ -d "node_modules/adbkit-monkey" ]; then
  pushd node_modules/adbkit-monkey
  rm src 2> /dev/null
  ln -s lib src 2> /dev/null
  popd
fi
