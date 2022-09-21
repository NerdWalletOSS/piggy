#!/bin/bash

set -x

EXTRA_ARGS=
if [[ ! -z $APPLE_API_KEY_ID ]]; then
  EXTRA_ARGS="DEVELOPMENT_TEAM=${APPLE_API_KEY_ID}"
fi

if [ `uname` = "Darwin" ]; then
  pushd extras/forwarder
  bundle install
  bundle exec pod install
  popd

  xcodebuild -workspace extras/forwarder/forwarder.xcworkspace \
    -configuration Release \
    -scheme forwarder \
    -derivedDataPath extras/forwarder/build/DerivedData \
    -verbose \
    ${EXTRA_ARGS}
  mkdir -p resources/mac/bin 2> /dev/null
  cp extras/forwarder/build/DerivedData/Build/Products/Release/forwarder resources/mac/bin/
fi
