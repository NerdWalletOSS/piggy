#!/bin/bash
if [ `uname` = "Darwin" ]; then
  pushd extras/forwarder
  bundle install
  bundle exec pod install
  popd
  xcodebuild -workspace extras/forwarder/forwarder.xcworkspace \
    -configuration Release \
    -scheme forwarder \
    -derivedDataPath extras/forwarder/build/DerivedData
  mkdir -p resources/mac/bin 2> /dev/null
  cp extras/forwarder/build/DerivedData/Build/Products/Release/forwarder resources/mac/bin/
fi
