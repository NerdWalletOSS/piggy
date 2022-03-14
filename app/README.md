# Overview

As apps grow over time they become more complicated to work with, slower to startup, and more tricky to debug and optimize. `piggy` was originally born out of a need to provide engineers with general-purpose tooling that was not yet available as part of the React Native development ecosystem; over time it evolved into a more general purpose platform used by NerdWallet mobile engineers to create internal, domain-specific tools quickly.

Out of the box `piggy` supports the following features:

- Inspection of all network requests and responses
- Federated JS and Native log events, in the same view
- Redux actions and state changes
- Device management, including automation of common `adb` tasks, and the ability to perform React Native debugging on iOS by forwarding TCP ports over USB.

# Features

Features are described in more detail in the [top-level README](/README.md), but some screenshots can be found below.

## Timeline

![screenshot-timeline-collapsed](/doc/images/screenshot-timeline-collapsed.png?raw=true 'Timeline with details and idle time collapsed.')

![screenshot-timeline-expanded](/doc/images/screenshot-timeline-expanded.png?raw=true 'Timeline with details visible.')

## Event Log

![screenshot-event-log](/doc/images/screenshot-event-log.png?raw=true 'Event Log with data inspection.')

## Redux State Subscriptions

![screenshot-state-subscriptions](/doc/images/screenshot-state-subscriptions.png?raw=true 'Event Log with data inspection.')

## Device Management

![screenshot-devices](/doc/images/screenshot-devices.png?raw=true 'Event Log with data inspection.')

## Building

1. Clone this repository.
2. `cd app/`
3. `yarn`
4. `bundle install`
5. `yarn run start` to build for local development
6. `yarn run release` to build a release artifact
