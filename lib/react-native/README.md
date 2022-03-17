# Overview

`@nerdwallet/react-native-piggy` is a library used in tandem with [piggy](https://github.com/NerdWalletOSS/piggy) to help developers debug certain classes of problems commonly encountered while developing frontend applications.

For more information about the tool itself, check out the [piggy](https://github.com/NerdWalletOSS/piggy) project.

Let's see how `@nerdwallet/react-native-piggy` can be integrated into your project.

> If you're interested in lower-level implementation details, perhaps because you'd like to add support for a different framework to technology stack, check out the [api docs](/doc/api.md).

# React Native

First you'll need to add `@nerdwallet/react-native-piggy` as a dependency.

```
yarn install @nerdwallet/react-native-piggy --save
```

## Android

The Android library is written in `Kotlin` and just uses standard Gradle tooling. It may also be used in `Java` projects.

### Gradle configuration

In `android/settings.gradle` you'll need to import the `Android` library as follows:

```
include ':react-native-piggy'
project(':react-native-piggy').projectDir = new File(
  rootProject.projectDir,
  '../node_modules/@nerdwallet/react-native-piggy/lib/android/library')
```

Then import it into your `android/app/build.gradle`:

```
dependencies {
  ...
  implementation 'com.facebook.react:react-native:+'
  ...
  implementation project(':react-native-piggy')
  ...
}
```

#### App configuration

The `Piggy` module can be configured with one of three pre-defined build flavors:

1. `PRODUCTION`: the tooling is disabled, and cannot be enabled. Full stop.
2. `BETA`: the tooling is disabled by default, but can be forced on if necessary.
3. `DEBUG`: the tooling is on, and enabled by default.

By default, the `Piggy` runs in `PRODUCTION` mode. That is, it's hard-disabled. It's up to the developer to set the `BETA` or `DEBUG` configurations however they see fit.

> We strongly recommend that you do **NOT** enable tooling in builds of your app that are released to the general public. A malicious third party could potentially intercept all of the data sent to the tool. Make sure the `buildFlavor` is set to `PRODUCTION` for your release builds.

### Kotlin

#### Adding the module to the Javascript runtime

Most standard React Native apps have a pre-generated class named `MainApplication` that implements the `ReactApplication` interface. Inside, is an extension of `ReactNativeHost` that allows the developer to specify third party packages; add the `PiggyPackage` there, as follows:

```kotlin
class MainApplication : Application(), ReactApplication {
  ...
  private val mReactNativeHost = object : ReactNativeHost(this) {
      ...
      override fun getPackages(): List<ReactPackage> {
        return Arrays.asList(
          ...
          PiggyPackage())
      }
      ...
  }
  ...
  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    ...
    Piggy.instance(this).buildFlavor = Piggy.Flavor.DEBUG /* or whatever build flavor you need */
  }
}
```

### Java

The following is the relevant code in Java:

```java
public class MainApplication extends Application implements ReactApplication {
  ...
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    ...
    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.asList(
          ...,
          new PiggyPackage()); /* inject the package */
    }
    ...
  }
  ...
  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, false);
    ...
    Piggy.Companion.instance(this).setBuildFlavor(Piggy.Flavor.DEBUG); /* or whatever build flavor you need */
  }
}
```

## iOS

### CocoaPods configuration

The iOS library is written in Swift and depends on `CocoaPods`. It depends on three external libraries, which will need to be added to your build target as follows:

```
...
workspace 'MyApp'
target 'MyApp' do
  project 'MyApp'
  ...
  pod 'Starscream',        '~> 3.1.0'
  pod 'CocoaAsyncSocket',  '~> 7.6.3'
  pod 'PeerTalk',          :git => 'https://github.com/rsms/peertalk.git'
  pod 'PiggyKit',          :path => $node_modules_path + '/@nerdwallet/react-native-piggy'
  ...
end
```

### App configuration

Similar to Android, `Piggy` on iOS exposes three distinct build types: `Debug`, `Beta`, and `Production` with the same semantics as their Android counterparts. Also like Android, the default configuration is set to `Production`, effectively disabling the tool. To enable the functionality, set your build type to `Debug` or `Beta` however you see fit.

> We strongly recommend that you do **NOT** enable tooling in builds of your app that are released to the general public. A malicious third party could potentially intercept all of the data sent to the tool. Make sure the `BuildType` is set to `Production` for your release builds.

Somewhere early during app bootstrap -- likely somewhere in your `AppDelegate`, you'll want to do something like the following:

#### Swift

```swift
func application(_ application: UIApplication,
                 didFinishLaunchingWithOptions launchOptions: LaunchOptions?) -> Bool {
  Piggy.instance.setBuildType(Piggy.BuildType.Debug) /* or whatever BuildType you need */
}
```

#### Objective-C

```c
#import <PiggyKit/PiggyKit-Swift.h>
...
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  ...
  [Piggy.instance setBuildType:BuildTypeDebug]; /* or whatever BuildType you need */
  return YES;
}
```

### TCP over USB

Debugging on physical devices can be tricky with React Native when on corporate networks with strict firewall rules, or when the development machine is on a different network than the phone.

This problem can be circumvented during Android development by forwarding TCP traffic over USB using `adb reverse`. Unfortunately no such tool exits out of the box for iOS development. This library provides an equivalent using [peertalk](https://github.com/rsms/peertalk) and [FBPortForwarding](https://github.com/facebook/react-native/tree/0.30-stable/Tools/FBPortForwarding).

Configuration is a relatively simple two step process:

1. Opt-in to the port forwarding feature by enabling it after initializing the library
2. Update the URL used to load the bundle

> Calling `Piggy.instance.enableTcpForwarding()` on a simulator is a no-op; it only works on physical devices.

Make the following tweaks to your `AppDelegate` class:

#### Swift

```swift
...
import PiggyKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate {
  ...
  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    ...
    Piggy.instance.setBuildType(Piggy.BuildType.Debug)
    Piggy.instance.enableTcpForwarding() /* Step (1) */
    return true
  }
  ...
  @objc func sourceURL(for bridge: RCTBridge!) -> URL? {
    return Piggy.instance.getBundleUrl(for: bridge) /* Step (2)
  }
}
```

#### Objective-C

```c
...
#import <PiggyKit/PiggyKit-Swift.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  ...
  [Piggy.instance setBuildType:BuildTypeDebug];
  [Piggy.instance enableTcpForwardingWith:nil]; /* Step (1) */
  return YES;
}
...
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [Piggy.instance getBundleUrlFor:bridge]; /* Step (2) */
}
```

> Note: By default, ports `8081` (metro bundler), `8347` (piggy) and `8888` (http proxy if you have one installed) are forwarded. You pass your own set of ports to `enableTcpForwarding()` if necessary.

# Javascript

All you need to do to initialize the library is `import` it and call `start()`. It's best to do this as early as possible in the startup process so no instrumented data gets lost. In your main `index.js`:

```javascript
import Piggy from '@nerdwallet/react-native-piggy';

Piggy.start();
```

Module initialization immediately queries the native library to see if it should be enabled. This is determined by looking at the `BuildType` specified by the application. If enabled, it'll do the following:

1. Patch the global `console` object to multiplex output to the standard console, but also the tool.
2. Patch `XMLHttpRequest` to intercept all HTTP traffic to send to the tool -- both to the timeline and the eventlog.
3. Establish an automatically-reconnecting `WebSocket` against the tool on port `8347`.

You can also specify which features should be enabled by passing additional information into the `start()` function:

```javascript
import Piggy from '@nerdwallet/react-native-piggy';

const { FEATURE } = Piggy.constants;

/* the following values are the the defaults -- tweak them as you see fit. */
Piggy.start({
  [FEATURE.HTTP]: true,
  [FEATURE.EVENT_LOG]: true,
  [FEATURE.CONSOLE]: true,
  [FEATURE.TIMELINE]: true,
});
```

## Console

As mentioned above, the tooling will patch the global `console`. It actually does two things:

1. Multiplexes output to the standard console, and also the tool (as mentioned above)
2. Adds a new method, `console.logger(tag)` that can be used to create an object that is (mostly) API compatible with `console`, but prefixes output with the specified `tag`. This is useful for searching and filtering when using the tool app.

```javascript
console.log('foo');
const logger = console.logger('my_component');
logger.warn('bar');
logger.error('baz');
```

Will output:

```
[global] foo
[my_component] bar
[my_component] baz
```

In addition, the library adds the ability to receive a callback whenever `console.error()` (or `console.logger().error()`) is invoked. This provides a convenient facility for reporting errors to external services in a generic fashion.

```javascript
import Piggy from '@nerdwallet/react-native-piggy';

Piggy.logger.addCustomErrorHandler((tag, ...args) => {
  /* log to an external service, database, file, etc */
});
```

## Event Log

In some cases you may not want certain data to get logged to the tool. If that's the case, you can configure custom `redactors` that can be used to strip sensitive or undesirable information before it's sent.

```javascript
import Piggy from '@nerdwallet/react-native-piggy';

const { eventLog, constants } = Piggy;

eventLog.setRedactorForEventType(
  constants.EVENT_TYPE.CONSOLE,
  (tag, ...args) => {
    const updatedArgs = fixUpData(...args); /* fix up your data here */
    return [tag, ...updatedArgs];
  }
);
```

Predefined event types include the following (but you are free to define your own):

```javascript
{
  CONSOLE: 'console',
  HTTP_REQUEST: 'http/request',
  HTTP_RESPONSE: 'http/response',
}
```

## HTTP

HTTP interception is turned on automatically when the tooling is enabled. Traffic is automatically reported to the timeline, and will be collated by HTTP hostname. Sometimes this generates a lot of noise, especially if multiple related services have different hostnames. You can configure how hostnames show up in the tool as follows:

```javascript
import Piggy from '@nerdwallet/react-native-piggy';

Piggy.http.setHostnameToAliasMap({
  'myfeaturev1.foo.com': 'HTTP (my_feature)',
  'myfeaturev2.foo.com': 'HTTP (my_feature)',
  'myfeaturev1.foostage.com': 'HTTP (my_feature)',
  'auth.foo.com': 'HTTP (auth)',
});
```

## Redux

Two types of Redux integration are included with the library: Actions and State changes.

### Actions/dispatch

With apps that utilize Redux for state management, it's often useful to understand when (and which) actions fire because they are often triggers for HTTP requests or navigation actions.

If you'd like, you can have the library patch the store's `dispatch()` method to report every dispatched Action to the Timeline and the Event Log.

```javascript
import Piggy from '@nerdwallet/react-native-piggy';
import { createStore } from 'redux';

...
const store = createStore(...);
Piggy.redux.initialize(store); /* good to go! */
```

### State changes

As the app is running it can be useful to browse state and observe changes in real time. The library ships with a [Redux Epic](https://redux-observable.js.org/docs/basics/Epics.html) that observes state changes and reports them. You can install it as follows:

```javascript
import { applyMiddleware, createStore } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import Piggy from '@nerdwallet/react-native-piggy';

const middlewares = [..., createEpicMiddleware()];
const store = createStore(rootReducer, applyMiddleware(...middlewares));
epicMiddleware.run(Piggy.redux.createEpic());
```

## Timeline

Reporting custom data to the timeline is easy.

The following example will draw a red horizontal track in the timeline, with two bars of data labeled _Obtain auth info_ and _Sync user data_, respectively.

```javascript
import Piggy from '@nerdwallet/react-native-piggy';

const stopwatch = Piggy.timeline.stopwatch('Startup', { colorHint: 'red' });
...

const auth = stopwatch.start('Obtain auth info');
/* get auth information */
auth.stop();

const sync = stopwatch.start('Sync user data');
/* sync user data */
sync.stop();

...

```

# Demo App

There is a sample application provided in the `<piggy-src>/lib/react-native/demo` directory of this repository. It can be used as a template for integrating `piggy` into your React Native application; it also demonstrates how to use the provided APIs.

The demo app looks like the following:

![screenshot-timeline-collapsed](/doc/images/screenshot-rn-demo-app.png?raw=true 'React Native demo app next to the Electron app.')

It can be started as follows:

1. `cd <piggy-src>/lib/react-native/`
2. `yarn start`
