# Purpose

The purpose of this document is to detail the inner workings of the tool and its associated library. It will discuss the following:

  1. How data is exchanged between the tool and the instrumented application.
  2. The general data exchange 'message' format.
  3. The contents and shapes of data exchanged.

# Data exchange

At a high level:
  1. The tool uses `express` and `express-ws` to start an HTTP and WebSocket server on port `8347` when the app loads.
  2. Instrumented clients will create a `WebSocket` and connect to the tool.
  3. After the `WebSocket` is connected, bi-directional communication is available by exchanging `JSON`-formatted messages.

# Message format

All messages bouncing around the system are formatted as follows:

```json
{
    "name": "/<pluginName>/<messageName>",
    "sessionId": "<sessionUuid>",
    "data": { ... }
}
```

* `name`: **[required]** a descriptive, unique, namespaced name for this message. It should be in the following format: `/pluginName/messageName`. This naming convention, however, is not enforced; it's simply a recommendation that makes debugging easier, and helps avoid name collisions between different plugins.
* `sessionId`: **[required]** some sort of generated ID that uniquely identifies the session instance associated with the instrumented app run. This can be something like a `uuid` or `timestamp`. The tool uses this to:
  1. group and collate data based on app run instance
  2. detect when one app run ends, and another starts, to flush ephemeral state.
* `data`: **[required]** context required for the message to be processed. This should always be an `object` or `array`.

> Note 1: Right now the message name format is not enforced, but likely will be in future versions of the tooling. When writing new functionality, please be sure to namespace your messages accordingly.

> Note 2: `data` is non-optional; use an empty `object {}` or `array []` literal if there's no data.

# Supported Messages

This section describes the messages that are supported out of the box.

## Timeline

Timeline data is used for visualizing wall-clock app performance in real time, as the instrumented app is being used.

The idea is that the calling app can specify one or more `Stopwatch`, which is a grouping of related `workUnits`. Each `WorkUnit` has a `name`, and `start` and `end` timestamps.

The tool aggregates data from all `Stopwatches` and displays them in a time-sequence diagram so the developer can (1) quickly understand where time is being spent, and (2) identify relationships between different instrumented subsystems in the app.

### Message format

```json
{
  "name": "/timeline/send",
  "sessionId": "ea706588-99eb-11e9-a2a3-2a2ae2dbcce4",
  "data": [...Stopwatches]
}
```

### Stopwatch

```json
{
  "name": "stopwatchName",
  "priority": 1,
  "colorHint": "white|blue|green|yellow|cyan|magenta|red",
  "workUnits": [...WorkUnits]
}
```
> * `name`: a user-friendly name that identifies the stopwatch.
> * `priority`: a display priority; lower numbers will appear higher up in the chart.
> * `colorHint`: **[optional]** hints to the tool how to colorize this item. The tool may choose not to honor this color in some cases.
> * `workUnits`: an array of `WorkUnits` for this stopwatch

### WorkUnit

```json
{
  "name": "workUnit name",
  "id": "<uuid>",
  "start": 1000,
  "end": 2000,
  "context": { ... },
  "checkpoints": [...CheckPoints]
}
```
> * `name`: a user-friendly name that identifies the unit of work
> * `id`: a unique identifier, generally a `uuid`, for this unit of work.
> * `start`: start time, in milliseconds
> * `end`: end time, in milliseconds
> * `context`: **[optional]** `JSON` object that provides context about this work item. Currently reserved for future use.
> * `checkpoints`: **[optional]** array of timestamps that represent subtasks performed within a piece of work.

### CheckPoint

```json
{
  "name": "checkpointName",
  "time": 1500,
}
```
> * `name`: human friendly name for this checkpoint
> * `time`: a timestamp that indicates when the checkpoint was reached. should be between the parent `workUnit`'s `start` and `end` timestamps (inclusive).

### Full example

```json
{
  "name": "/timeline/send",
  "sessionId": "ea706588-99eb-11e9-a2a3-2a2ae2dbcce4",
  "data":[
    {
      "name": "Native Startup",
      "priority": 0,
      "colorHint": "magenta",
      "workUnits": [
        {
          "name": "Load Javscript",
          "id": "28b7492e-99ec-11e9-a2a3-2a2ae2dbcce4",
          "start": 0,
          "end": 2500,
          "context": {
            "type": "active"
          },
          "checkpoints": [
            {
              "name": "Download",
              "time": 500
            },
            {
              "name": "Parse",
              "time": 2000
            },
            {
              "name": "Call entry point",
              "time": 2300
            }
          ]
        },
        ...moreWorkUnits
      ],
    },
    ...moreStopwatches
  ]
}
```

## Event Log

The Event Log is like a development console on steroids. In addition to displaying standard console logs, warnings, and errors, it also federates navigation events, http requests and responses, view renders, and any other arbitrary information specified by the instrumented app.

### Message format

```json
{
  "name": "/eventLog/send",
  "sessionId": "ea706588-99eb-11e9-a2a3-2a2ae2dbcce4",
  "data": {
    "type": "<eventLogType>",
    "level": "log|info|debug|warn|error",
    "colorHint": "white|blue|green|yellow|cyan|magenta|red",
    "timestamp": 1000,
    "tag": "<customTag>",
    "data": { ... } || [ ... ]
  }
}
```
> * `type`: the type of data being logged. this can either be a well-known type, as defined below, or an arbitrary type defined by the calling app. Well-known types have specialized, context-aware logic and views associated with them in the tool. Non-well-known items will not have any additional embellishments.
> * `level`: the logging level for the specified items. the level specifies how the item will be rendered by the tool; for example, `error` items will be red, `warn` items will be yellow, and so on.
> * `colorHint`: **[optional]** hints to the tool how to colorize this item. The tool may choose not to honor this color in some cases.
> * `timestamp`: a timestamp, in milliseconds, that represents when the event occurred in the calling app.
> * `tag`: **[optional]** generally the name of the component or subsystem that generated the event. used in the tool for filtering purposes.
> * `data`: an `object` or `array` that contains the data required to render the log entry. If a well-known `type` is specified, it must conform to that type's data shape defined below.

### Well-known types

The following `types` are considered to be _well known_; each contains different context-specific data that will be used to build custom UI by the tool:

* `console`: something was logged to the console
* `http/request`: an http request was made
* `http/response`: an http response was received
* `navigation/request`: the user is attempting to navigate somewhere
* `navigation/resolve`: the navigation attempt was eventually resolved successfully
* `navigation/reject`: the attempt to navigate was rejected
* `navigation/broadcast`: a synchronous navigation event was received

### Console

The wrapper object should set `type: 'console'`

```json
{
  ...,
  "type": "console",
  "data": [...arrayOfArgs]
}
```
> * `data`: the list of things to log. this should generally just be the array of input arguments fed into the instrumented app's `log()` method.

### HTTP

The `type` field in the wrapper structure should needs to be set to one of the following:
* `http/request`
* `http/response`

```json
{
  ...,
  "type": "http/...",
  "data": {
    "id": "<uuid>"
    "url": "http://...",
    "parameters": {
      "status": 200,
      "method": "get|post|put|patch|delete|head|options"
      "data": "<responseDataAsString>",
      "headers": {...},
      ...yourCustomData
    }
  }
}
```
> * `id`: a globally unique identifier, generally a `uuid`. Make sure to use the same `id` for both the `http/request` and `http/response` so the tooling can aggregate them together.
> * `status`: **[http/response only]** the HTTP status code of the response
> * `method`: **[http/request only]** the HTTP method used in the request
> * `finalUrl`: **[optional]** **[http/response only]** if the request was redirected, this field contains the resulting URL.
> * `data`: **[optional]** for an **[http/request]** this is the post body, for an **[http/response]** this is the response body.
> * `headers`: an object where the keys are the header names, and the values are the header values.

### Navigation

Navigation, especially for web and mobile apps, often encompasses a relatively complex set of asynchronous operations that are generally triggered by user interaction. Instrumenting and logging navigation-related events can be very useful when trying to diagnose certain classes of problems.

Two navigation-related concepts are supported by the tool:

1. `Routing Requests`: things like showing a screen or a dialog, dismissing a modal, or handling the back button. On many platforms these operations are asynchronous; for example: the user presses a button, then business logic asks the routing layer to display a screen. The routing layer then tries to process the `request`, and eventually `resolves` it successfully, or `rejects` it with an error. These cases are handled with the following three event `types`:
  * `navigation/request`
  * `navigation/resolve`
  * `navigation/reject`
2. `Broadcasts`: unidirectional, synchronous events that are related to navigation. These are usually things leading up to, or side effects from, a `Routing Request`. For example: after a navigation request has finished, a toast was displayed, or a toolbar was hidden, etc. For these types of operations, the following `type` should be used:
  * `navigation/broadcast`

```json
{
  ...,
  "type": "navigation/..."
  "data": {
    "id": "<uuid>",
    "event": "eventName",
    ...yourCustomData
  }
}
```

### Generic items

In some cases you may want to report custom data to the event log. You can do so by forming a message with `type` set to whatever you want, and specifying either an `object` or `array` as the `data` payload.

If `data` is set to an `array`, it will be drawn similar to a `Console` entry. If it's an `object` then just the `type` and `title` will be displayed, and the developer will be able to select the item to see the `data` payload.

Let's look at a quick example.

#### Example: Redux

With apps that utilize Redux for state management, it's often useful to understand when (and which) actions fire because they are often triggers for HTTP requests or navigation actions.

The wrapper object could set the `type` to something like `redux/action`, then send a payload as follows:

```json
{
  ...,
  "type": "redux/action"
  "title": "<actionType>",
  "data": {
    ...actionData,
  }
}
```


## State Subscriptions

Apps have state; almost always some amount of transient state, and generally some persisted state. While debugging it's often useful to be notified when said state changes.

If state in your app can be represented by unique _paths_ or _keys_, you can publish changes to the tool; doing so allows developers to more easily understand what's changing while the user is moving through the app.

A reference implementation of state subscriptions with `Redux` is included with the library.

### Subscribing to state changes

The developer uses the tool to register for state changes by clicking the state subscriptions tab, and then pressing the `add` button in the toolbar. The developer can then enter a _path_, which will be sent to the instrumented app as follows:

```json
{
  "name": "/stateSubscriptions/setPaths",
  "sessionId": "<targetSessionId>"|undefined,
  "data": {
    paths: [...listOfPathKeys]
  }
}
```
> * `sessionId`: the target session identifier, or undefined to send to all connected sessions.
> * `data.paths`: a list of all paths that should be monitored by the instrumented app.

The instrumented app should store this list of paths, monitor state, and send messages back to the tool whenever relevant data has has changed.

### Reporting state changes

From the instrumented app, send a message in the following format if data for the path(s) it represents has changed:

```json
{
  "name": "/stateSubscriptions/update",
  "sessionId": "<uniqueSessionId>",
  "data": {
    "pathKey1": { ...stateForPathKey1 },
    "pathKey2": { ...stateForPathKey2 },
    ...
  }
}
```
> * `data`: an `object` where the the keys are paths, and the values are the relevant state that has changed. The values may either be a complete representation of the state, or simply a diff of only the changed fields.

# FAQ
* `Q`: why not use something like `protobufs` instead of `WebSockets`?
* `A`: optimized binary message formats may be faster, but add a higher barrier to entry. `WebSockets` are more ubiquitous and generally work 'out of the box' quickly for most frameworks and runtimes.
