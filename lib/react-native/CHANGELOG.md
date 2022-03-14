## 1.8.0 (clangen)

* Dependency updates. 

## 1.7.2 (clangen)

* Improve JS timeline accuracy.

## 1.7.0 (clangen)

* Symbolicate stack traces for RN exceptions.
* Upgraded to RN 0.65.1
* Upgraded to Android 12
* Upgraded to Android Studio Arctic Fox

## 1.4.2 (clangen)

* Filled out some missing fields in `package.json` and `PiggyKit.podspec`

## 1.4.1 (clangen)

* Expose `createLogger` method from `logger` module.

## 1.4.0 (martin-cotta)

* Add npm run commands:
  * `npm run pods`
  * `npm run android`
  * `npm run ios`
* update typescript and @types
* Update `uuid` to version 8.x (and add `react-native-get-random-values`)
* Move `uuid` & `react-native-get-random-values` to peerDependencies
* [iOS] Enable react-native auto-linking
* [iOS] Make `.podspec` compatible with Xcode 12
* [Android] Upgrade Gradle plugin

## 1.3.3 (martin-cotta)

* Don't check for node version, CI would have the desired one.

## 1.3.2 (clangen)

- Ensure `logger.warn()` calls invoke LogBox errors on React Native.

## 1.3.1 (martin-cotta)

- Disable features when the native module is not available.

## 1.3.0 (martin-cotta)

- iOS deployment target is now 11.0
- iOS auto-linking support
- React Native 0.63.2 support
- Updated ESLint configuration
- Update `prettier` and add format-on-save settings
- Update engines and add preinstall check
- New `npm run pods` run script

## 1.2.2 (clangen)

- Fix CI

## 1.2.1 (clangen)

- Fixed a bug where registered error callbacks were not always being invoked.

## 1.2.0 (clangen)

- Use `Flipper-PeerTalk` so we can co-exist with Flipper without hacks.

## 1.1.0 (clangen)

- Added `logger.setSystemConsoleEnabled()` to disable/enable system-level console logging.

## 1.0.3 (clangen)

- Some micro-optimizations to make running in a test environment faster.

## 1.0.2 (clangen)

- Added Promise detection to `deepClean`

## 1.0.0 (clangen)

- React Native 0.61 support (not backwards compatible with 0.5x or earlier)

## 0.2.11 (Casey Langen)

- Improved HTTP/Apollo request interception and reporting.

## 0.2.6 (Ben Han)

- Add `ReactProfiler` devtool constant.

## 0.2.5 (Ben Han)

- There's nothing here. Best to look around...
