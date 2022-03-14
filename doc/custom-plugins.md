# Overview

`piggy` is designed to be used as a simple, pre-configured sandbox for quick development of custom tooling. While the app provides a couple useful features out of the box for mobile development, it can also be easily extended to host tools specific to your project or organization.

There's no complicated package management or development environment setup; clone the repository, then supply a function that returns a list of `plugin` definitions, and off you go.

# The definition of a custom `plugin`

At a high level, a `plugin` is simply an object instance that contains a `React` `Component` to be rendered in the main view when it is activated, an `icon` and `title` that represents it in the user interface, and `key` that will be used to uniquely identify it under the hood.

The full structure is defined as follows:

```javascript
export default {
  PluginComponent: MyPluginComponent,  /* required */
  IconComponent: MyIconComponent,      /* optional; this or `fontAwesomeIcon` */
  fontAwesomeIcon: faThList,           /* optional; this or 'IconComponent' */
  key: 'unique-identifier-or-uuid',    /* required */
  title: 'my plugin name',             /* required */
  order: 0,                            /* optional; desired sort order in list */
  onLoaded: () => { },                 /* optional; called after app startup finishes */
};
```

Let's take a look at these properties:
1. `PluginComponent`: a `React` `Component` type that will be rendered in the app's main window when the plugin is selected by the user. The provided `Component` will not be passed any props, except for a single `visible` `boolean`.
2. `IconComponent`: a `Component` that will be rendered for the plugin's icon in the list. If you do not want to use a custom `Component`, you can use a `FontAwesome` icon instead (see below).
3. `fontAwesomeIcon`: `FontAwesome` is included as a dependency in the app; any of the provided icons can be used to represent the plugin. If you do not wish to use `FontAwesome`, you can supply a custom `Component` instead, via `IconComponent`.
4. `key`: a string that uniquely identifies this plugin. Does not need to be user-readable, and can be something like a uuid. This is used internally for bookkeeping purposes.
5. `title`: the user-facing title of the plugin.
6. `order`: the desired sort order in the plugins list.
7. `onLoaded`: an optional function to be invoked after plugin initialization has completed.

# Loading custom `plugins` at runtime

During startup the app will check to see if the file `<piggy-src-root>/app/src/App/Plugins/External/index.js` exists. If it does, it will be imported; this source unit is assumed to export a `default` function that returns an array of `plugin` definitions. That's it.

The app will call this function at the appropriate time, just after resolving built-in plugins. The array returned will be merged with the built-ins, sorted, and made available to the user on the vertical toolbar on the left side of the app's main window.

```javascript
import MyCustomPlugin1 from './MyCustomPlugin1';
import MyCustomPlugin2 from './MyCustomPlugin2';
/* ... */

export default () => [MyCustomPlugin1, MyCustomPlugin2, /* ... */];

```

After the plugin loading phase completes, each plugin's `onLoaded` method will be called (if defined).

# Plugin development workflow

As noted elsewhere, the app's architecture is intentionally primitive to make it as simple as possible to bootstrap and iterate on your own extensions. There are two relatively easy ways to get started writing your own functionality:

* Fork (or clone) the `piggy` repository and just add your code. This is the simplest approach, and you'll be up and running in just a few seconds. Build and run the app, then:
    1. Create a new `plugin` definition as described above. This can live anywhere, but it's probably a good idea to put it somewhere within the `<piggy-src-root>/app/src/App/Plugins/External/` directory
    2. Add a new `<piggy-src-root>/app/src/App/Plugins/External/index.js` as described above to return the plugin created in (1).
    3. Refresh the app; your plugin should appear in the left hand side of the main window in the vertical toolbar.


* Use a `git` `submodule`
    1. Create a new `git` repository that will contain your plugins.
    2. In this repository, create an `index.js` file that will provide the plugin loader function described just above.
    3. Mount this new module as a `submodule` within the `piggy` repository at the correct location:
        - `git submodule add git@github.com:MyUserName/my-piggy-extensions.git app/src/App/Plugins/External/`
    4. Add a new `plugin` definition, and return it from the `index.js` file.
    3. Refresh the app; your plugin should appear in the left hand side of the main window in the vertical toolbar.

# Interacting with the `WebSocket`

Plugins generally won't be able to do anything useful without data, and as mentioned above, no data will be provided to the `PluginComponent`. Further, the application itself does not provide a generalized backing data store. That leaves it to you to source your data however you see fit. You can read from local files, query a database, make HTTP requests, or do anything else you'd like.

`piggy` does, however, provide a pre-configured `WebSocket` that can be leveraged to get up and running quickly.

## Connecting your app to `piggy`

* If you're using `React Native` you can use the [@nerdwallet/react-native-piggy library](/lib/react-native) included in this repository.
* If you're not using `React Native`, you can connect directly to the running app using a `WebSocket` on port `8347`.

All messages sent from your app to `piggy` must be formatted as follows:

```json
{
  "name": "/<pluginName>/<messageName>",
  "sessionId": "<sessionUuid>",
  "data": { ... }
}
```

Detailed information about the message format and API can be found in the [API docs page](/docs/API.md).

## Listening for `WebSocket` messages

When `WebSocket` messages are received from the connected client(s), they will be parsed, validated, and then re-emitted so plugins can be notified. Plugins can listen for incoming `WebSocket` messages by subscribing to the `global.ipc.events` `EventListener` as follows:

```javascript
  componentDidMount() {
    global.ipc.events.on('/ws/recv/pluginName/messageName', (event, message) => {
      /* event: an Electron IpcMainEvent object (https://www.electronjs.org/docs/api/ipc-main#ipcmainevent-object) */
      /* message: the parsed message as a JSON object, consisting of { name, sessionId, data } */
    });
  }
```

Because `WebSocket` connections are bi-directional, your plugins can also send messages back to the connected clients:

```javascript
  global.ipc.events.emit('/ws/send/pluginName/messageName', { name, data });
```

`piggy`'s internal `WebSocket` server will then parse this outgoing message request, and broadcast it to all connected clients.

# Styling

Your tools, your look-and-feel. `piggy` does not impose any restrictions around styling your plugins. That said, because the plugins are compiled as part of the app itself, you have complete access to app-defined shared widgets, colors, and styles. Take a look at the following directories to see what's available:
* A standard layout for plugins with a title and toolbar: [PluginLayout](/app/src/App/Widgets/Plugin)
* Layouts and Widgets: [app/src/App/Widgets/](/app/src/App/Widgets/)
* Shared functionality, including pre-defined colors: [app/src/App/Lib/](/app/src/App/Lib)

# Example

Let's put all the pieces described above together and create a simple custom plugin.

## Step 1: the `React` `Component`

Filename: `<piggy-src/app/src/App/Plugins/External/MyPlugin/MyPlugin.js`

```javascript
import React from 'react';

export default () => <div>hello, world!</div>;
```

## Step 2: the `plugin` `definition`

Filename: `<piggy-src/app/src/App/Plugins/External/MyPlugin/index.js`

```javascript
import { faStar } from '@fortawesome/free-solid-svg-icons';
import MyPlugin from './MyPlugin';

export default {
  PluginComponent: MyPlugin,
  key: '4509436e-a937-11eb-bcbc-0242ac130002',
  title: 'my plugin',
  fontAwesomeIcon: faStar,
  order: 0,
};
```

## Step 3: the `resolver` function

```javascript
import MyPlugin from './MyPlugin';

export default () => [MyPlugin];
```

## Step 4: verify integration

Start up `piggy`:
1. `cd <piggy-src>/app/`
2. `yarn && yarn start`

After the app boots your new plugin should be visible on the list, and selecting it will show the `hello, world!`:
![screenshot-custom-plugin-1](/doc/images/screenshot-custom-plugin-1.png?raw=true 'Custom plugin with no data.')

## Step 5: integrate with WebSocket messages

Let's add some functionality `MyPlugin.js` now. Let's hook all incoming messages to the built-in `EventLog` plugin, and display the types of messages, with their associated timestamps, as they're received.

```javascript
import React, { PureComponent } from 'react';

const EVENT_LOG_MESSAGE = '/ws/recv/eventLog/send';

export default class MyPlugin extends PureComponent {
  constructor(props) {
    super(props);
    /* we'll keep track of the messages in an array stored in our component state */
    this.state = { entries: [] };
  }

  /* when the component mounts, register a listener to be called whenever a message of
  the specified type is received from a client */
  componentDidMount = () =>
    global.ipc.events.on(EVENT_LOG_MESSAGE, this.handleWebSocketMessage);

  /* every time a new message comes in, add it to the head of the array */
  handleWebSocketMessage = (event, message) => {
    this.setState((previousState) => ({
      entries: [
        `[${message.data.timestamp}] ${message.data.type}`,
        ...previousState.entries,
      ],
    }));
  };

  /* unregister our WebSocket listener so we don't leak memory if we're ever unmounted */
  componentWillUnmount = () =>
    global.ipc.events.off(EVENT_LOG_MESSAGE, this.handleWebSocketMessage);

  render = () => {
    const { entries } = this.state;
    return (
      <div>
        {entries.map((e) => (
          <div>{e}</div>
        ))}
      </div>
    );
  };
}
```

We now have something that looks like the following:
![screenshot-custom-plugin-2](/doc/images/screenshot-custom-plugin-2.png?raw=true 'Custom plugin with data')

## Step 5: Use some prefab components

```javascript
import React, { PureComponent } from 'react';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import { Toolbar, ToolbarIcon } from '@widgets/Toolbar';
import GenericChip from '@widgets/Chip/GenericChip';
import { StyleSheet, css } from 'aphrodite/no-important';
import colors, { offsetColor } from '@lib/colors';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const EVENT_LOG_MESSAGE = '/ws/recv/eventLog/send';

/* define some basic styles, using app-provided colors and color manipulation
routines */
const styles = StyleSheet.create({
  row: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: offsetColor(colors.background, 0.2),
    margin: 8,
  },
  timestampChip: { backgroundColor: colors.green },
});

export default class MyPlugin extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { entries: [] };
  }

  componentDidMount = () =>
    global.ipc.events.on(EVENT_LOG_MESSAGE, this.handleWebSocketMessage);

  handleWebSocketMessage = (event, message) => {
    this.setState((previousState) => ({
      entries: [
        {
          timestamp: new Date(message.data.timestamp).toLocaleTimeString(
            'en-US'
          ),
          type: message.data.type,
        },
        ...previousState.entries,
      ],
    }));
  };

  componentWillUnmount = () =>
    global.ipc.events.off(EVENT_LOG_MESSAGE, this.handleWebSocketMessage);

  /* a prefab Toolbar component that can be used to display a list of buttons in
  the header of a `PluginLayout` (see below) */
  renderToolbar = () => (
    <Toolbar>
      <ToolbarIcon
        tooltip={<span>clear</span>}
        fontAwesomeIcon={faTrash}
        onClick={() => this.setState({ entries: [] })}
      />
    </Toolbar>
  );

  render = () => {
    const { entries } = this.state;
    return (
      /* a PluginLayout adds a header with a title and a user-specified set of components
      that can be rendered as toolbars */
      <PluginLayout
        title="my plugin"
        toolbarComponents={[this.renderToolbar()]}
      >
        <div>
          {entries.map((e) => (
            <div className={css(styles.row)}>
              <GenericChip
                caption={e.timestamp}
                chipStyle={styles.timestampChip}
              />
              <div style={{ marginLeft: 4 }}>{e.type}</div>
            </div>
          ))}
        </div>
      </PluginLayout>
    );
  };
}
```

With just a few extra lines of code, we now have a custom plugin that looks just like the built-ins:

![screenshot-custom-plugin-3](/doc/images/screenshot-custom-plugin-3.png?raw=true 'Custom plugin with data and styles')
