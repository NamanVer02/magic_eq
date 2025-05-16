import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import EqualizerModule, {BandLevel, Preset} from './EqualizerModule';

// Default audio session ID (0 for global output mix)
const DEFAULT_AUDIO_SESSION_ID = 0;

const EqualizerView: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<number>(-1);
  const [bandLevels, setBandLevels] = useState<BandLevel[]>([]);
  const [bandLevelRange, setBandLevelRange] = useState<number[]>([0, 0]);

  // Load equalizer settings
  useEffect(() => {
    const loadEqualizerSettings = async () => {
      try {
        setIsLoading(true);

        // Get the enabled state
        const enabled = await EqualizerModule.isEnabled();
        setIsEnabled(enabled);

        // Get the band level range
        const range = await EqualizerModule.getBandLevelRange();
        setBandLevelRange(range);

        // Get all available presets
        const allPresets = await EqualizerModule.getAllPresets();
        setPresets(allPresets);

        // Get current preset
        const preset = await EqualizerModule.getCurrentPreset();
        setCurrentPreset(preset);

        // Get all band levels
        const bands = await EqualizerModule.getAllBandLevels();
        setBandLevels(bands);

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        Alert.alert('Error', `Failed to load equalizer settings: ${error}`);
      }
    };

    loadEqualizerSettings();
  }, []);

  // Toggle equalizer enabled/disabled
  const toggleEnabled = async (value: boolean) => {
    try {
      await EqualizerModule.setEnabled(value);
      setIsEnabled(value);
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to ${value ? 'enable' : 'disable'} equalizer: ${error}`,
      );
    }
  };

  // Select a preset
  const selectPreset = async (presetId: number) => {
    try {
      await EqualizerModule.usePreset(presetId);
      setCurrentPreset(presetId);

      // Update band levels after preset change
      const bands = await EqualizerModule.getAllBandLevels();
      setBandLevels(bands);
    } catch (error) {
      Alert.alert('Error', `Failed to set preset: ${error}`);
    }
  };

  // Adjust a band level
  const adjustBandLevel = async (bandId: number, level: number) => {
    try {
      await EqualizerModule.setBandLevel(bandId, level);

      // Update the band level in state
      setBandLevels(prevLevels =>
        prevLevels.map(band => (band.id === bandId ? {...band, level} : band)),
      );

      // Presets are no longer valid when manually adjusting bands
      setCurrentPreset(-1);
    } catch (error) {
      Alert.alert('Error', `Failed to adjust band level: ${error}`);
    }
  };

  // Format frequency for display (convert Hz to kHz if needed)
  const formatFrequency = (frequency: number) => {
    if (frequency >= 1000) {
      return `${(frequency / 1000).toFixed(1)} kHz`;
    }
    return `${frequency} Hz`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading Equalizer Settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Text style={styles.title}>Audio Equalizer</Text>
          <View style={styles.enabledContainer}>
            <Text style={styles.enabledText}>Enabled</Text>
            <Switch
              value={isEnabled}
              onValueChange={toggleEnabled}
              trackColor={{false: '#767577', true: '#000000'}}
              thumbColor={isEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Presets */}
          <View style={styles.presetsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsContainer}>
              {presets.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetButton,
                    currentPreset === preset.id && styles.presetButtonActive,
                  ]}
                  onPress={() => selectPreset(preset.id)}>
                  <Text
                    style={[
                      styles.presetButtonText,
                      currentPreset === preset.id &&
                        styles.presetButtonTextActive,
                    ]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Band Levels */}
          <ScrollView
            style={styles.bandsContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bandsContentContainer}>
            {bandLevels.map((band, index) => (
              <View
                key={band.id}
                style={[
                  styles.bandControl,
                  index === 0 && styles.firstBandControl,
                ]}>
                <View style={styles.bandLabelContainer}>
                  <Text style={styles.bandFrequency}>
                    {formatFrequency(band.centerFreq)}
                  </Text>
                  <Text style={styles.bandValue}>
                    {(band.level / 100).toFixed(1)} dB
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={bandLevelRange[0]}
                  maximumValue={bandLevelRange[1]}
                  value={band.level}
                  minimumTrackTintColor="#000000"
                  maximumTrackTintColor="#CCCCCC"
                  thumbTintColor="#000000"
                  onValueChange={value =>
                    adjustBandLevel(band.id, Math.round(value))
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    color: '#000000',
    fontWeight: 'bold',
  },
  enabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enabledText: {
    marginRight: 8,
    fontSize: 16,
    color: '#000000',
  },
  presetsWrapper: {
    height: 28,
    marginBottom: 8,
  },
  presetsContainer: {
    flexGrow: 0,
  },
  presetButton: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    height: 26,
    justifyContent: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  presetButtonText: {
    color: '#000000',
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
  },
  bandsContainer: {
    flex: 1,
    marginTop: 0,
  },
  bandsContentContainer: {
    paddingTop: 0,
  },
  bandControl: {
    marginBottom: 18,
    marginTop: 6,
  },
  firstBandControl: {
    marginTop: 0,
  },
  bandLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  bandFrequency: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  bandValue: {
    fontSize: 12,
    color: '#444444',
  },
  slider: {
    height: 35,
    width: '100%',
  },
});

export default EqualizerView;
