import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import EqualizerModule, {BandLevel, Preset} from './EqualizerModule';
import { NativeWindStyleSheet } from "nativewind";

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
      <View className="flex-1 bg-transparent">
        <View className="flex-1 bg-white rounded-t-3xl pt-5 pb-5 px-8">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="mt-4 text-base text-black text-center">Loading Equalizer Settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <View className="flex-1 bg-white rounded-t-3xl pt-5 pb-5 px-8">
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-2xl text-black font-bold">Audio Equalizer</Text>
          <View className="flex-row items-center">
            <Text className="mr-2 text-base text-black">Enabled</Text>
            <Switch
              value={isEnabled}
              onValueChange={toggleEnabled}
              trackColor={{false: '#767577', true: '#000000'}}
              thumbColor={isEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View className="flex-1 flex-col">
          {/* Presets */}
          <View className="h-7 mb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-grow-0">
              {presets.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  className={`bg-gray-200 px-3 py-0.5 rounded-full mr-2.5 border border-gray-300 h-[26px] justify-center ${
                    currentPreset === preset.id ? 'bg-black border-black' : ''
                  }`}
                  onPress={() => selectPreset(preset.id)}>
                  <Text
                    className={`text-black font-medium text-sm text-center ${
                      currentPreset === preset.id ? 'text-white' : ''
                    }`}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Band Levels */}
          <ScrollView
            className="flex-1 mt-0"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 0 }}
            >
            {bandLevels.map((band, index) => (
              <View
                key={band.id}
                className={`mb-4.5 ${index === 0 ? 'mt-0' : 'mt-1.5'}`}>
                <View className="flex-row justify-between items-center mb-0.5">
                  <Text className="text-sm text-black font-medium">
                    {formatFrequency(band.centerFreq)}
                  </Text>
                  <Text className="text-xs text-gray-700">
                    {(band.level / 100).toFixed(1)} dB
                  </Text>
                </View>
                <Slider
                  className="h-[35px] w-full"
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

export default EqualizerView;
