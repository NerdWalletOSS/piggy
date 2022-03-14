import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

const SCREEN_BACKGROUND_COLOR = '#1d2021';
const FEATURE_BACKGROUND_COLOR = '#3c3836';
const LIGHT_TEXT_COLOR = '#ebdbb2';
const DARK_TEXT_COLOR = '#3c3836';
const FEATURE_BORDER_COLOR = '#ebdbb2';
const BUTTON_BACKGROUND_COLOR = '#d5c4a1';
const BUTTON_ACTIVE_BORDER_COLOR = '#fb4934';

export default StyleSheet.create({
  container: {
    padding: 4,
    flex: 1,
    backgroundColor: SCREEN_BACKGROUND_COLOR,
  },
  feature: {
    margin: 4,
    borderRadius: 8,
    backgroundColor: FEATURE_BACKGROUND_COLOR,
    borderWidth: 2,
    borderColor: FEATURE_BORDER_COLOR,
    overflow: 'hidden',
  },
  featureTitle: {
    padding: 2,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: LIGHT_TEXT_COLOR,
  },
  featureSubtitle: {
    color: LIGHT_TEXT_COLOR,
    padding: 2,
    paddingLeft: 6,
  },
  featureButtonBar: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: BUTTON_BACKGROUND_COLOR,
    borderColor: BUTTON_BACKGROUND_COLOR,
    color: DARK_TEXT_COLOR,
    padding: 8,
    margin: 4,
    borderRadius: 4,
    flex: 1,
    borderWidth: 1,
  },
  buttonActive: {
    borderColor: BUTTON_ACTIVE_BORDER_COLOR,
  },
  buttonText: {
    textAlign: 'center',
  },
});
