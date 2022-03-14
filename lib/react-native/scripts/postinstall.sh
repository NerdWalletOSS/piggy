#!/usr/bin/env bash

if [[ -z $CI ]] && [[ ! $PWD =~ node_modules ]]; then
  yarn pods
fi

if [[ ! $PWD =~ node_modules ]]; then
  ./scripts/patch-android-build.sh
fi
