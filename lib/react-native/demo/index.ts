import 'react-native-get-random-values'; /* required by uuid; needs to be imported first */
import Piggy from '@nerdwallet/react-native-piggy';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

const { FEATURE } = Piggy.constants;

Piggy.start({
  [FEATURE.HTTP]: true,
  [FEATURE.EVENT_LOG]: true,
  [FEATURE.CONSOLE]: true,
  [FEATURE.TIMELINE]: true,
});

AppRegistry.registerComponent(appName, () => App);
