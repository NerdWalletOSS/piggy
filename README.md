#  piggy

<img src="/app/public/icon.png" alt="piggy icon" width="100" height="100">

# Overview

`piggy` aims to be a simple sandbox for developers who want a quick way to create custom tooling for their own projects.

This repository provides both a [stand-alone Electron app](https://github.com/NerdWallet/piggy/tree/main/app/), and a reference implementation of a [client-side library](https://github.com/NerdWallet/piggy/tree/main/lib/react-native) for use with [React Native](https://reactnative.dev/). Eventually, libraries for different languages or runtimes may be included.

While it does provide some useful functionality out of the box, it's best to think of `piggy` as a straightforward, pre-configured, non-opinionated playground that uses [Electron](https://www.electronjs.org/) and [React](https://reactjs.org/) to communicate with your applications using [WebSockets](https://developer.mozilla.org/en-US/doc/Web/API/WebSockets_API); stream data to `piggy`, grab it from the WebSocket, and display it in a React component however you want.

While [similar projects](https://github.com/facebook/flipper) exist, they tend to have more ambitious goals: extension bundling, publishing, sharing, etc. That's great for certain classes of tooling, but also introduces a more complicated architecture that can be time consuming or intimidating to integrate against, especially if you just need to build a few one-off, in-house tools.

That said, we do believe that the stock version of `piggy` can be immediately useful to some [React Native]() developers, so notarized binaries are provided in the [Releases]() section of this project, and the client-side React Native library is available via [npmjs.com]().

Let's take a quick look at the `piggy` UI:
![screenshot-timeline-collapsed](/doc/images/screenshot-timeline-collapsed.png?raw=true 'Timeline with details and idle time collapsed.')

You can add your own tooling to the left bar by simply dropping some source files in the correct directory and reloading the app. The plugins in the screenshot are included in the [app/App/Plugins/Standard](https://github.com/NerdWallet/piggy/tree/main/app/src/App/Plugins/Standard) directory as examples. If you want to learn more about writing your own tools, please see the [custom plugin documentation](/doc/custom-plugins.md).

Due to the (lack of) architecture, your plugins just become part of the app. There are no sandboxing rules between plugins, and your code has access to all of the app internals. Again, this design decision is intentional. `piggy` plugins are not necessarily meant to be shared and published to the world, they are supposed to be tools that help **you** build **your** app, filling in gaps that may exist with existing solutions.

# Standard (built-in) plugins

## Timeline

Over time applications grow to contain multiple complicated, loosely coupled subsystems for things like networking, state management, navigation and various other domain-specific tasks. Loosely coupled subsystems are great for reuse, extensibility and testability, but often times they can make software more difficult to reason about.

In addition, the subsystems are often implicitly affected by performance or timing of other subsystems, making certain types of optimization (like app startup) time-consuming and error prone.

The Timeline plugin can be used to:

- Obtain a visual overview of what an app is doing over time, as its running
- Measure how long subsystems are taking to complete their tasks.
- Identify implicit dependencies between subsystems.
- Spot certain classes of unexpected behavior that may not result in errors.
- Generally understand how the app works, at a high level.

![screenshot-timeline-collapsed](/doc/images/screenshot-timeline-collapsed.png?raw=true 'Timeline with details and idle time collapsed.')

![screenshot-timeline-expanded](/doc/images/screenshot-timeline-expanded.png?raw=true 'Timeline with details visible.')

## Event Log

The Event Log plugin federates logs and information from multiple large subsystems, and provides quick tools for filtering and searching. It includes:

- Logs from both the JS and native layers
- All HTTP traffic
- Navigation events
- Redux actions

As the app is used, the log is updated in real-time. It has a couple nice features baked in, including the ability to:

- View HTTP request and response data
- Copy HTTP requests as cURL commands
- Inspect the contents of Redux actions

![screenshot-event-log](/doc/images/screenshot-event-log.png?raw=true 'Event Log with data inspection.')

## State Subscriptions

While developing apps that use Redux it can often be useful to be notified when global state changes. The State Subscriptions tab allows developers to monitor changes to slices in the store, in real time.

![screenshot-state-subscriptions](/doc/images/screenshot-state-subscriptions.png?raw=true 'Event Log with data inspection.')

## Device Management

Connecting to and debugging on physical devices can be annoying (and in some cases difficult), especially for developers without a lot of experience with pure-native development. The **Devices** tab in the tool has a couple nifty features to aide development on both iOS and Android hardware.

### Connected Clients and the Blacklist

The `Connected Clients` section can be used to see which devices are connected to the tooling. The device type, followed by an IP address, then a `device identifier` is displayed for each connected client.

Sometimes, especially in automation environments, it may be useful to disallow specific devices from connecting to the tool. For these cases, devices can be blacklisted by `device identifier`.

![screenshot-devices](/doc/images/screenshot-devices.png?raw=true 'Event Log with data inspection.')

### Android Devices

The `Android Devices` section is a thing wrapper over the `adb` binary that assists with the following:

1. Starting or restarting the `adb` server
2. Automatically setting up `adb reverse` for TCP ports `8081` (metro bundler), `8347` (tooling), and `8888` (http proxy, if available).
3. Grabbing screenshots and `adb logcat` dumps

> `adb reverse` is used to forward `TCP` ports over `USB` (or over Wifi). This allows your app on a device to access services running on your development machine via the device's `localhost`.
>
> For example, if you have a server on your computer running on port `1234`, and you connect your device via `USB` and run `adb reverse tcp:1234 tcp1234`, on device you can access the server running on the computer by connecting to `localhost:1234`.

### iOS TCP over USB

The iOS development environment doesn't support anything like `adb reverse` out of the box, which makes testing on device difficult, especially if the development machine and phone are on different networks.

One can work around this by using a combination of

- [peertalk](https://github.com/rsms/peertalk), a library that abstracts communication between a host computer and a device over `USB`
- [FBPortForwarding](https://github.com/facebook/react-native/tree/0.30-stable/Tools/FBPortForwarding), which is an abstraction on top of `peertalk` that allows for forwarding `TCP` traffic.

The tool and associated library packages these two pieces of functionality together with an easy to use API. Once integrated, as with Android, the following `TCP` ports will be forwarded over `USB`: `8081` (metro bundler), `8347` (tooling), and `8888` (http proxy, if available).

See the [integration guide](#) for more information.

## Session Import/Export

Sometimes QA (or other users) run into difficult-to-reproduce bugs. If the bug can be reproduced while the app is attached to tooling, all Timeline and Event Log data can be imported and exported from the main app menu:

The resulting file can be attached to a bug report, and later imported by the developer that is troubleshooting the problem.

The current session can also be downloaded via local HTTP server, by simply making a request against `http://localhost:8347/session/`. This can be useful in automation environments.

# FAQ

* Q: Does `piggy` only work with React Native apps?
    * A: Nope! `piggy` doesn't care what type of client sends it data. However, at this time we are only providing a client side library for React Native because it's our main, in-house use case. That said, building bindings for other languages or runtimes should be relatively trivial; as mentioned before, if you can create a WebSocket in your app, you can use `piggy`.
* Q: For React Native apps, why use `piggy` over other popular developer tools like React Native Debugger, Chrome DevTools, or Reactotron?
    * A: We don't necessarily recommend using `piggy` **over** existing solutions; it's designed to complement existing tooling!
* Q: Why is this project named "piggy"?
    * A: `piggy` is short for "piggy bank," something cute and vaguely on-brand for our company and community. Also, I'm not good at naming things.
