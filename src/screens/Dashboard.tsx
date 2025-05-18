import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  NativeModules,
  DeviceEventEmitter,
  Image,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import EqualizerModule, {BandLevel, Preset} from '../services/EqualizerModule';

// Enable playback in silence mode
Sound.setCategory('Playback');

// Default audio session ID (0 for global output mix)
const DEFAULT_AUDIO_SESSION_ID = 0;

// Define MediaInfo type
interface MediaInfo {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  isPlaying: boolean;
  packageName?: string;
}

const Dashboard: React.FC = () => {
  // Media player states
  const [sound, setSound] = useState<Sound | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasSoundFile, setHasSoundFile] = useState<boolean>(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);

  // Equalizer states
  const [isEqualizerEnabled, setIsEqualizerEnabled] = useState<boolean>(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<number>(-1);
  const [bandLevels, setBandLevels] = useState<BandLevel[]>([]);
  const [bandLevelRange, setBandLevelRange] = useState<number[]>([0, 0]);
  const [isEqualizerVisible, setIsEqualizerVisible] = useState<boolean>(false);

  // Initialize sound and equalizer
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true);

        // Initialize the equalizer with default audio session
        await EqualizerModule.initialize(DEFAULT_AUDIO_SESSION_ID);

        // Get the enabled state
        const enabled = await EqualizerModule.isEnabled();
        setIsEqualizerEnabled(enabled);

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

        // Load the sample sound
        const sample = new Sound('sample.wav', Sound.MAIN_BUNDLE, error => {
          if (error) {
            console.warn('Failed to load sound: ', error);
            setHasSoundFile(false);
          } else {
            setSound(sample);
            setHasSoundFile(true);
          }
        });

        // For demonstration, set dummy media info
        setDummyMediaInfo();

        // If we're on Android, set up media session listeners
        if (Platform.OS === 'android') {
          if (NativeModules.MediaSessionModule) {
            NativeModules.MediaSessionModule.startListening();
            DeviceEventEmitter.addListener(
              'onMediaSessionUpdate',
              handleMediaUpdate,
            );
          }
        }

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        Alert.alert('Error', `Failed to initialize audio: ${error}`);
      }
    };

    initializeAudio();

    // Cleanup on unmount
    return () => {
      if (sound) {
        sound.release();
      }

      if (Platform.OS === 'android' && NativeModules.MediaSessionModule) {
        NativeModules.MediaSessionModule.stopListening();
        DeviceEventEmitter.removeAllListeners('onMediaSessionUpdate');
      }
    };
  }, []);

  // Handle media session updates from native module
  const handleMediaUpdate = (info: MediaInfo) => {
    setMediaInfo(info);
  };

  // For demonstration purposes - set dummy data
  const setDummyMediaInfo = () => {
    setMediaInfo({
      title: 'Song Title',
      artist: 'Artist Name',
      album: 'Album Name',
      isPlaying: true,
      packageName: 'com.spotify.music',
    });
  };

  // Toggle equalizer enabled/disabled
  const toggleEqualizerEnabled = async (value: boolean) => {
    try {
      await EqualizerModule.setEnabled(value);
      setIsEqualizerEnabled(value);
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

  // Toggle playback
  const togglePlayback = () => {
    if (!sound || !hasSoundFile) {
      return;
    }

    if (isPlaying) {
      sound.pause();
      setIsPlaying(false);

      // Update mediaInfo
      if (mediaInfo) {
        setMediaInfo({...mediaInfo, isPlaying: false});
      }
    } else {
      sound.play(success => {
        if (!success) {
          Alert.alert('Error', 'Failed to play sound');
        }
        setIsPlaying(false);

        // Update mediaInfo
        if (mediaInfo) {
          setMediaInfo({...mediaInfo, isPlaying: false});
        }
      });

      setIsPlaying(true);

      // Update mediaInfo
      if (mediaInfo) {
        setMediaInfo({...mediaInfo, isPlaying: true});
      }
    }
  };

  // Get app name from package name
  const getAppName = (packageName?: string): string => {
    if (!packageName) return 'Unknown App';

    // Map common package names to app names
    const appMap: {[key: string]: string} = {
      'com.spotify.music': 'Spotify',
      'com.google.android.youtube': 'YouTube',
      'com.google.android.apps.youtube.music': 'YouTube Music',
      'com.amazon.mp3': 'Amazon Music',
      'com.apple.android.music': 'Apple Music',
      'pandora.android': 'Pandora',
      'com.soundcloud.android': 'SoundCloud',
    };

    return appMap[packageName] || packageName.split('.').pop() || 'Unknown App';
  };

  // Skip to previous or next track
  const handleSkip = (direction: 'prev' | 'next') => {
    // In a real app, this would use the MediaSession API
    Alert.alert(
      'Media Control',
      `Skip ${direction === 'prev' ? 'previous' : 'next'}`,
    );
  };

  // Toggle equalizer visibility
  const toggleEqualizerView = () => {
    setIsEqualizerVisible(!isEqualizerVisible);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black p-4">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-3 text-base">
          Loading Audio Dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Media Player Section - Reduced padding and spacing */}
      <View className="flex-1 p-4">
        <Text className="text-xl text-white font-bold text-center mb-3">
          Audio Dashboard
        </Text>

        <View className="items-center">
          {/* Smaller Album Art */}
          <View className="mb-3">
            {mediaInfo?.artwork ? (
              <Image
                source={{uri: mediaInfo.artwork}}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: '#333333',
                }}
              />
            ) : (
              <View className="w-[140] h-[140] rounded-full justify-center items-center bg-neutral-800">
                <Text className="text-5xl text-white font-bold">
                  {mediaInfo?.title?.charAt(0) ||
                    mediaInfo?.artist?.charAt(0) ||
                    '♫'}
                </Text>
              </View>
            )}
          </View>

          {/* Title and Artist - More compact */}
          <View className="w-full items-center mb-2">
            <Text
              className="text-xl text-white font-bold mb-1 text-center"
              numberOfLines={1}>
              {mediaInfo?.title || 'Unknown Title'}
            </Text>
            <Text
              className="text-base text-neutral-300 mb-1 text-center"
              numberOfLines={1}>
              {mediaInfo?.artist || 'Unknown Artist'}
            </Text>
            {mediaInfo?.packageName && (
              <Text className="text-xs text-neutral-400 text-center">
                via {getAppName(mediaInfo.packageName)}
              </Text>
            )}
          </View>

          {/* Playback Controls */}
          <View className="flex-row justify-center items-center mb-3 w-full">
            <TouchableOpacity
              className="p-2 mx-4"
              onPress={() => handleSkip('prev')}>
              <Text className="text-2xl text-white">⏮</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[50] h-[50] rounded-full bg-white justify-center items-center mx-4"
              onPress={togglePlayback}>
              <Text className="text-xl text-black">
                {mediaInfo?.isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-2 mx-4"
              onPress={() => handleSkip('next')}>
              <Text className="text-2xl text-white">⏭</Text>
            </TouchableOpacity>
          </View>

          {/* Equalizer toggle button removed */}
        </View>
      </View>

      {/* Equalizer Section - Fixed at bottom with white background, always visible */}
      <View className="bg-white rounded-t-xl px-4 pt-3 p-10 h-1/2">
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-lg text-black font-bold">Audio Equalizer</Text>
          <View className="flex-row items-center">
            <Text className="text-sm text-black mr-2">Enabled</Text>
            <Switch
              value={isEqualizerEnabled}
              onValueChange={toggleEqualizerEnabled}
              trackColor={{false: '#767577', true: '#000000'}}
              thumbColor={isEqualizerEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Presets */}
        {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-10 mb-3"
          contentContainerStyle={{paddingVertical: 3}}>
          {presets.map(preset => (
            <TouchableOpacity
              key={preset.id}
              className={`bg-neutral-200 px-4 py-1 rounded-full mr-2 border border-neutral-300 ${
                currentPreset === preset.id ? 'bg-black border-black' : ''
              }`}
              onPress={() => selectPreset(preset.id)}>
              <Text
                className={`text-xs font-medium ${
                  currentPreset === preset.id ? 'text-white' : 'text-black'
                }`}>
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView> */}

        {/* Band Sliders */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {bandLevels.map(band => (
            <View key={band.id} className="mb-2">
              <View className="flex-row justify-between mb-1">
                <Text className="text-black text-xs font-medium">
                  {formatFrequency(band.centerFreq)}
                </Text>
                <Text className="text-neutral-600 text-xs">
                  {(band.level / 100).toFixed(1)} dB
                </Text>
              </View>
              <Slider
                style={{width: '100%', height: 36}}
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
  );
};

export default Dashboard;
