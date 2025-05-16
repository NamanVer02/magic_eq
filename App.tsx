/**
 * Magic Equalizer Demo App
 */

import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  View,
  Text,
} from 'react-native';

import EqualizerView from './src/EqualizerView';
import AudioPlayer from './src/AudioPlayer';

function App(): React.JSX.Element {
  // Hide navigation bar on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setHidden(true);
      // This would normally be done with native modules, but here we're just hiding the status bar
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />

      {Platform.OS === 'android' ? (
        <View style={styles.contentContainer}>
          <View style={styles.topSection}>
            <AudioPlayer />
          </View>
          <View style={styles.bottomSection}>
            <EqualizerView />
          </View>
        </View>
      ) : (
        <View style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedText}>
            The Equalizer API is currently only supported on Android devices.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  topSection: {
    flex: 0.4,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  bottomSection: {
    flex: 0.6,
    backgroundColor: '#000000',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  unsupportedText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
});

export default App;
