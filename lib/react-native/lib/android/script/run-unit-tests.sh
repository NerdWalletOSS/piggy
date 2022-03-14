#!/bin/sh

# make sure unit tests pass!
set -e
ENABLE_NAVIGATION_TESTING=1 ./gradlew assembleDebugAndroidTest
adb -e push library/build/outputs/apk/androidTest/debug/library-debug-androidTest.apk /data/local/tmp/com.nerdwallet.navigation.test
adb -e shell pm install -t -r "/data/local/tmp/com.nerdwallet.navigation.test"
adb -e shell am instrument -w -r -e debug false com.nerdwallet.navigation.test/com.nerdwallet.test.TestRunner
