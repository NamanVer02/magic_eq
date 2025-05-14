/**
 * Magic Equalizer Demo App
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  View,
  Text,
  ScrollView,
} from 'react-native';

import EqualizerView from './src/EqualizerView';
import AudioPlayer from './src/AudioPlayer';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      {Platform.OS === 'android' ? (
        <ScrollView style={styles.scrollView}>
          <AudioPlayer />
          <EqualizerView />
        </ScrollView>
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unsupportedText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
  },
});

export default App;
