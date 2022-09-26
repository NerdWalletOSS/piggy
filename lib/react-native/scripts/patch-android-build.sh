#!/bin/sh

# Most (all?) of our third party Android RN dependencies were built from the
# same gradle template that is not longer completely compatible with updated
# build tooling. This script detects and patches gradle files with invalid/
# outdated configurations. It does the following:
#
# 1. Updates all build tooling and target/compile SDK versions to v30
# 2. Updates the Android gradle plugin to v7.0.0
# 3. Ensures `google`, AND `mavenCentral` are added as to
#    repository lists.

echo "Patching Android Gradle files..."
COMPILE_SDK_VERSION='31'
TARGET_SDK_VERSION='31'
BUILD_TOOLS_VERSION="31.0.0"
GRADLE_PLUGIN_VERSION="classpath 'com.android.tools.build:gradle:7.2.1'"
MAVEN_REPOSITORIES="repositories {\n  google()\n  mavenCentral()\n}"
APPCOMPAT_LIBRARY="implementation \"androidx.appcompat:appcompat:1.3.0\""

for dir in `find "node_modules" -name "android"`
do
    for file in `find $dir -name 'build.gradle' -print`
    do
        echo "    patching: $file"
        sed -Ei.nwrnbak "
          s/^([ \t]*)compileSdkVersion.*$/\1compileSdkVersion $COMPILE_SDK_VERSION/g
          s/^([ \t]*)targetSdkVersion.*$/\1targetSdkVersion $TARGET_SDK_VERSION/g
          s/^([ \t]*)buildToolsVersion.*$/\1buildToolsVersion \"$BUILD_TOOLS_VERSION\"/g
          s/^([ \t]*)def DEFAULT_COMPILE_SDK_VERSION.*$/\1def DEFAULT_COMPILE_SDK_VERSION = $COMPILE_SDK_VERSION/g
          s/^([ \t]*)def DEFAULT_TARGET_SDK_VERSION.*$/\1def DEFAULT_TARGET_SDK_VERSION = $TARGET_SDK_VERSION/g
          s/^([ \t]*)def DEFAULT_BUILD_TOOLS_VERSION.*$/\1def DEFAULT_BUILD_TOOLS_VERSION = \"$BUILD_TOOLS_VERSION\"/g
          s/^([ \t]*)classpath \'com\.android\.tools\.build\:gradle\:.*$/\1$GRADLE_PLUGIN_VERSION/g
          s/^([ \t]*)implementation \"com\.android\.support\:appcompat\-v7.*\"$/\1$APPCOMPAT_LIBRARY/g
          s/^([ \t]*)apply plugin: 'kotlin-android-extensions'.*//g
          s/^([ \t]*)apply plugin: 'maven'.*//g
        " $file

        # The regex matches something like this:
        #   repositories {
        #     (jcenter() | mavenCentral() | google())+
        #   }
        #
        # And replaces it with:
        #
        #   repositories {
        #     google()
        #     mavenCentral()
        #   }
        #
        perl -i.nwrnbak -0pe "s/repositories \{([\s\n]*(jcenter|mavenCentral|google)\(\)\n\s*)+[\s\n]*\}/$MAVEN_REPOSITORIES/g" $file

        # Remove all other references to `jcenter()`, as it is no longer available
        perl -i.nwrnbak -0pe "s/jcenter\(\)//g" $file
    done
done

echo ""
echo "Running 'jetify' for AndroidX compatibility..."
npx jetify
