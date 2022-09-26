import React, { useCallback, useState } from 'react';
import {
  Text,
  TouchableHighlight,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';
import Piggy from '@nerdwallet/react-native-piggy';
import styles from './AppStyles';

const COLOR_HINT_TO_UI_COLOR = {
  magenta: '#b16286',
  green: '#7a7915',
  red: '#cc251d',
};

interface ButtonProps {
  title: string;
  active?: boolean;
  onPress: () => void;
}

const Button: React.FC<ButtonProps> = ({ title, active, onPress }) => {
  const extendedStyle = active ? styles.buttonActive : undefined;
  const internalOnPress = useCallback(() => {
    onPress?.();
  }, []);
  return (
    <TouchableHighlight
      underlayColor="#665c54"
      style={[styles.button, extendedStyle]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableHighlight>
  );
};

interface FeatureProps {
  name: string;
  priority: number;
  colorHint: string;
}

const Feature: React.FC<FeatureProps> = ({ name, priority, colorHint }) => {
  const headerColor = { backgroundColor: COLOR_HINT_TO_UI_COLOR[colorHint] };
  const label = `feature/${name}`;
  const [logger] = useState(console.logger(label));
  const [stopwatch] = useState(
    Piggy.timeline.stopwatch(label, priority, { colorHint })
  );
  const [timer, setTimer] = useState();
  const [count, setCount] = useState(0);

  const handleLogInfoPress = useCallback(() => {
    logger.info('info pressed');
  }, [logger]);
  const handleLogWarnPress = useCallback(() => {
    logger.warn('warn pressed');
  }, [logger]);
  const handleLogErrorPress = useCallback(() => {
    try {
      throw Error('Boo!');
    } catch (ex) {
      logger.error('error caught', ex);
    }
  }, [logger]);

  const handleTimelineStartPress = useCallback(() => {
    if (timer) {
      timer.stop();
    }
    setTimer(stopwatch.start(`work item ${count}`));
    setCount(count + 1);
  }, [stopwatch, timer, setTimer, count, setCount]);
  const handleTimelineStopPress = useCallback(() => {
    if (timer) {
      timer.stop();
      setTimer(undefined);
    }
  }, [timer, setTimer]);
  const handleTimelineCheckpointPress = useCallback(() => {
    stopwatch.checkpoint('checkpoint');
  }, [stopwatch]);

  return (
    <View style={styles.feature}>
      <Text
        style={[styles.featureTitle, headerColor]}
      >{`dummy feature: ${name}`}</Text>
      <Text style={styles.featureSubtitle}>event log:</Text>
      <View style={styles.featureButtonBar}>
        <Button title="info" onPress={handleLogInfoPress} />
        <Button title="warn" onPress={handleLogWarnPress} />
        <Button title="error" onPress={handleLogErrorPress} />
      </View>
      <Text style={styles.featureSubtitle}>timeliner:</Text>
      <View style={styles.featureButtonBar}>
        <Button
          title="start"
          active={!!timer}
          onPress={handleTimelineStartPress}
        />
        <Button title="stop" onPress={handleTimelineStopPress} />
        <Button title="checkpoint" onPress={handleTimelineCheckpointPress} />
      </View>
    </View>
  );
};

const Http = () => {
  const handleRequestButton = useCallback(() => {
    fetch('https://google.com');
  }, []);

  return (
    <View style={styles.feature}>
      <Text style={[styles.featureTitle]}>http</Text>
      <View style={styles.featureButtonBar}>
        <Button title="make http request" onPress={handleRequestButton} />
      </View>
    </View>
  );
};

export default () => (
  <SafeAreaView style={styles.container}>
    <ScrollView>
      <Feature name="foo" priority={1} colorHint="magenta" />
      <Feature name="bar" priority={2} colorHint="green" />
      <Feature name="baz" priority={3} colorHint="red" />
      <Http />
    </ScrollView>
  </SafeAreaView>
);
