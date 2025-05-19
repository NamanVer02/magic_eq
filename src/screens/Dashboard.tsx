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
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../App';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import EqualizerModule, {BandLevel, Preset} from '../services/EqualizerModule';
import Icon from 'react-native-vector-icons/Ionicons';

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

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

const Dashboard: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const insets = useSafeAreaInsets();
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
        <Text className="text-white mt-3 text-base font-poppins-regular">
          Loading Audio Dashboard...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black pt-2">
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="px-4 py-3">
          <Text className="text-2xl text-white font-poppins-bold text-center mt-2 mb-2">
            Audio Dashboard
          </Text>
          <Text className="text-base text-neutral-400 font-poppins-regular text-center mb-4">
            Adjust your sound to match your preferences
          </Text>
        </View>

        {/* Media Player Section - Reduced padding and spacing */}
        <View className="flex-1 p-4">
          <View className="items-center">
            {/* Smaller Album Art */}
            <View className="mb-3">
              {mediaInfo?.artwork ? (
                <Image
                  source={{uri: mediaInfo.artwork}}
                  className="w-[140] h-[140] rounded-full bg-neutral-800"
                />
              ) : (
                <View className="w-[140] h-[140] rounded-full justify-center items-center bg-neutral-800">
                  <Icon name="musical-note" size={48} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Title and Artist - More compact */}
            <View className="w-full items-center mb-2">
              <Text
                className="text-xl text-white font-poppins-bold mb-1 text-center"
                numberOfLines={1}>
                {mediaInfo?.title || 'Unknown Title'}
              </Text>
              <Text
                className="text-base text-neutral-300 font-poppins-regular mb-1 text-center"
                numberOfLines={1}>
                {mediaInfo?.artist || 'Unknown Artist'}
              </Text>
              {mediaInfo?.packageName && (
                <Text className="text-xs text-neutral-400 font-poppins-regular text-center">
                  via {getAppName(mediaInfo.packageName)}
                </Text>
              )}
            </View>

            {/* Playback Controls */}
            <View className="flex-row justify-center items-center mb-3 w-full">
              <TouchableOpacity
                className="p-2 mx-4"
                onPress={() => handleSkip('prev')}>
                <Icon name="play-skip-back" size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-[50] h-[50] rounded-full bg-white justify-center items-center mx-4"
                onPress={togglePlayback}>
                <Icon
                  name={mediaInfo?.isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#000000"
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="p-2 mx-4"
                onPress={() => handleSkip('next')}>
                <Icon name="play-skip-forward" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Moods Button */}
        <View className="px-4 mb-4">
          <TouchableOpacity
            className="bg-white rounded-full py-4 items-center"
            onPress={() => navigation.navigate('Moods')}>
            <Text className="text-base text-black font-poppins-semibold">
              Find Mood Presets
            </Text>
          </TouchableOpacity>
        </View>

        {/* Equalizer Section - Styled to match Moods page */}
        <View className="bg-neutral-800 rounded-t-xl px-4 pt-5 pb-8 h-1/2">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl text-white font-poppins-bold">
              Audio Equalizer
            </Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-white font-poppins-regular mr-2">
                Enabled
              </Text>
              <Switch
                value={isEqualizerEnabled}
                onValueChange={toggleEqualizerEnabled}
                trackColor={{false: '#767577', true: '#FFFFFF'}}
                thumbColor={isEqualizerEnabled ? '#000000' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Presets Section */}
          {presets.length > 0 && (
            <View className="mb-5">
              <Text className="text-base text-white font-poppins-semibold mb-3">
                Presets:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {presets.map((preset, index) => (
                  <TouchableOpacity
                    key={preset.id}
                    className={`mr-3 px-4 py-2 rounded-full ${currentPreset === preset.id ? 'bg-white' : 'border border-neutral-700'}`}
                    onPress={() => selectPreset(preset.id)}>
                    <Text 
                      className={`${currentPreset === preset.id ? 'text-black font-poppins-medium' : 'text-white font-poppins-regular'}`}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Band Sliders */}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {bandLevels.map(band => (
              <View key={band.id} className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white text-xs font-poppins-medium">
                    {formatFrequency(band.centerFreq)}
                  </Text>
                  <Text className="text-neutral-400 text-xs font-poppins-regular">
                    {(band.level / 100).toFixed(1)} dB
                  </Text>
                </View>
                <Slider
                  className="w-full h-9"
                  minimumValue={bandLevelRange[0]}
                  maximumValue={bandLevelRange[1]}
                  value={band.level}
                  minimumTrackTintColor="#FFFFFF"
                  maximumTrackTintColor="#555555"
                  thumbTintColor="#FFFFFF"
                  onValueChange={value =>
                    adjustBandLevel(band.id, Math.round(value))
                  }
                />
              </View>
            ))}
          </ScrollView>
          
          {/* Save Preset Button */}
          <TouchableOpacity 
            className="border border-white rounded-full px-4 py-3 mt-4 items-center">
            <Text className="text-sm text-white font-poppins-medium">
              Save Current Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  ); 
};

export default Dashboard;
