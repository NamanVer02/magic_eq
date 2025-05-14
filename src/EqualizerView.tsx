import React, { useEffect, useState } from 'react';
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
import EqualizerModule, { BandLevel, Preset } from './EqualizerModule';

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
      Alert.alert('Error', `Failed to ${value ? 'enable' : 'disable'} equalizer: ${error}`);
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
        prevLevels.map(band => 
          band.id === bandId ? { ...band, level } : band
        )
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading Equalizer Settings...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audio Equalizer</Text>
        <View style={styles.enabledContainer}>
          <Text style={styles.enabledText}>Enabled</Text>
          <Switch
            value={isEnabled}
            onValueChange={toggleEnabled}
          />
        </View>
      </View>
      
      {/* Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Presets</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.presetsContainer}
        >
          {presets.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetButton,
                currentPreset === preset.id && styles.presetButtonActive
              ]}
              onPress={() => selectPreset(preset.id)}
            >
              <Text 
                style={[
                  styles.presetButtonText,
                  currentPreset === preset.id && styles.presetButtonTextActive
                ]}
              >
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Band Levels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Band Levels</Text>
        <View style={styles.bandsContainer}>
          {bandLevels.map(band => (
            <View key={band.id} style={styles.bandControl}>
              <Text style={styles.bandFrequency}>
                {formatFrequency(band.centerFreq)}
              </Text>
              <Text style={styles.bandValue}>
                {(band.level / 100).toFixed(1)} dB
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={bandLevelRange[0]}
                maximumValue={bandLevelRange[1]}
                value={band.level}
                minimumTrackTintColor="#4285F4"
                maximumTrackTintColor="#CCCCCC"
                thumbTintColor="#4285F4"
                onValueChange={(value) => adjustBandLevel(band.id, Math.round(value))}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  enabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enabledText: {
    marginRight: 8,
    fontSize: 16,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  presetsContainer: {
    paddingVertical: 8,
  },
  presetButton: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  presetButtonActive: {
    backgroundColor: '#4285F4',
  },
  presetButtonText: {
    color: '#333333',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
  },
  bandsContainer: {
    marginTop: 8,
  },
  bandControl: {
    marginBottom: 16,
  },
  bandFrequency: {
    fontSize: 14,
    color: '#333333',
  },
  bandValue: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  slider: {
    marginTop: 4,
    height: 40,
    width: '100%',
  },
});

export default EqualizerView; 