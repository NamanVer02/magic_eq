import React, {useEffect, useState, useRef} from 'react';
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
  Dimensions,
  Animated,
  Easing,
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

const {width: screenWidth} = Dimensions.get('window');

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
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const barAnimations = useRef<Animated.Value[]>([]).current;
  const sliderAnimations = useRef<{[key: number]: Animated.Value}>({}).current;
  const presetAnimations = useRef<{[key: number]: Animated.Value}>({}).current;

  // Initialize animations for equalizer bars, sliders, and presets
  useEffect(() => {
    // Create animation values for each band level
    if (bandLevels.length > 0 && barAnimations.length === 0) {
      bandLevels.forEach((band) => {
        barAnimations.push(new Animated.Value(0));
        // Initialize slider animations for each band
        sliderAnimations[band.id] = new Animated.Value(band.level);
      });
      
      // Animate the bars sequentially
      Animated.stagger(
        50,
        barAnimations.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
        ),
      ).start();
    }
    
    // Initialize preset animations
    if (presets.length > 0) {
      presets.forEach(preset => {
        if (!presetAnimations[preset.id]) {
          presetAnimations[preset.id] = new Animated.Value(1);
        }
      });
    }
  }, [bandLevels, barAnimations, presets]);

  // Entrance animations
  useEffect(() => {
    if (!isLoading) {
      // Fade in the entire screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Slide up the content
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Scale up the content
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, fadeAnim, slideAnim, scaleAnim]);
  
  // Initialize sound and equalizer
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true); // Initialize the equalizer with default audio session
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

  // Toggle equalizer enabled/disabled with animation
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

  // Select a preset with animation
  const selectPreset = async (presetId: number) => {
    try {
      // Animate the selected preset
      Object.keys(presetAnimations).forEach(id => {
        const numId = Number(id);
        Animated.spring(presetAnimations[numId], {
          toValue: numId === presetId ? 1.05 : 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }).start();
      });
      
      await EqualizerModule.usePreset(presetId);
      setCurrentPreset(presetId);

      // Update band levels after preset change
      const bands = await EqualizerModule.getAllBandLevels();
      
      // Animate the transition of band levels
      bands.forEach(band => {
        if (sliderAnimations[band.id]) {
          Animated.spring(sliderAnimations[band.id], {
            toValue: band.level,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      });
      
      setBandLevels(bands);
    } catch (error) {
      Alert.alert('Error', `Failed to set preset: ${error}`);
    }
  }; // Adjust a band level with smooth animation
  const adjustBandLevel = async (bandId: number, level: number) => {
    try {
      // Animate the slider value
      if (sliderAnimations[bandId]) {
        Animated.spring(sliderAnimations[bandId], {
          toValue: level,
          friction: 7,
          tension: 40,
          useNativeDriver: false,
        }).start();
      }
      
      await EqualizerModule.setBandLevel(bandId, level);

      // Update the band level in state
      setBandLevels(prevLevels =>
        prevLevels.map(band => (band.id === bandId ? {...band, level} : band)),
      );

    } catch (error) {
      Alert.alert('Error', `Failed to adjust band level: ${error}`);
    }
  };

  // Format frequency for display (convert Hz to kHz if needed)
  const formatFrequency = (frequency: number) => {
    if (frequency >= 1000) {
      return `${(frequency / 1000).toFixed(1)}k`;
    }
    return `${frequency}`;
  };

  // Get the visual height for the slider based on its value
  const getSliderVisualHeight = (level: number, range: number[]) => {
    const [min, max] = range;
    const normalizedValue = (level - min) / (max - min);
    return Math.max(0.1, normalizedValue); // Minimum 10% height
  };

  // Get color based on frequency band - Monochromatic
  const getBandColor = (frequency: number, level: number, range: number[]) => {
    const [min, max] = range;
    const normalizedLevel = (level - min) / (max - min);
    
    // Use grayscale values for monochromatic design
    const intensity = Math.floor(normalizedLevel * 255);
    const grayValue = Math.max(128, intensity); // Keep it visible with minimum brightness
    
    return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
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
      <View className="flex-1 bg-black p-4 justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-3 text-base font-poppins-regular">
          Loading Audio Dashboard...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black pt-2">
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim }
        ],
        flex: 1,
      }}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{flexGrow: 1}}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 bg-black">
          {/* Header */}
          <View className="px-4 py-3">
            <Text className="text-2xl text-white font-poppins-bold text-center mt-2 mb-2">
              Audio Dashboard
            </Text>
            <Text className="text-base text-neutral-400 font-poppins-regular text-center mb-4">
              Adjust your sound to match your preferences
            </Text>
          </View>... {/* Compact Media Player Section */}
          <View className="px-4 py-6">
            <View className="flex-row items-center justify-between bg-neutral-900 rounded-2xl px-4 py-3">
              {/* Album Art - Much smaller */}
              <View className="flex-row items-center flex-1">
                {mediaInfo?.artwork ? (
                  <Image
                    source={{uri: mediaInfo.artwork}}
                    className="w-12 h-12 rounded-lg bg-neutral-800"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-lg justify-center items-center bg-neutral-800">
                    <Icon name="musical-note" size={20} color="#FFFFFF" />
                  </View>
                )}
                
                {/* Title and Artist - Compact */}
                <View className="flex-1 ml-3 mr-2">
                  <Text
                    className="text-base text-white font-poppins-bold"
                    numberOfLines={1}>
                    {mediaInfo?.title || 'Unknown Title'}
                  </Text>
                  <Text
                    className="text-sm text-neutral-400 font-poppins-regular"
                    numberOfLines={1}>
                    {mediaInfo?.artist || 'Unknown Artist'}
                  </Text>
                </View>
              </View>

              {/* Compact Playback Controls */}
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="p-2"
                  onPress={() => handleSkip('prev')}>
                  <Icon name="play-skip-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-white justify-center items-center mx-2"
                  onPress={togglePlayback}>
                  <Icon
                    name={mediaInfo?.isPlaying ? 'pause' : 'play'}
                    size={16}
                    color="#000000"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  className="p-2"
                  onPress={() => handleSkip('next')}>
                  <Icon name="play-skip-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Grid-based Equalizer Section */}
          <View className="px-4 pb-4 space-y-3">
            {/* Equalizer Header Card */}
            <View className="bg-neutral-900 rounded-2xl px-4 py-3 mb-3">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-xl text-white font-poppins-bold">
                    Equalizer
                  </Text>
                  <Text className="text-xs text-neutral-400 font-poppins-regular mt-1">
                    Fine-tune your audio experience
                  </Text>
                </View>
                <View className="items-center">
                  <Switch
                    value={isEqualizerEnabled}
                    onValueChange={toggleEqualizerEnabled}
                    trackColor={{false: '#374151', true: '#FFFFFF'}}
                    thumbColor={isEqualizerEnabled ? '#000000' : '#9CA3AF'}
                    ios_backgroundColor="#374151"
                    style={{
                      transform: [{scaleX: 1.1}, {scaleY: 1.1}],
                    }}
                  />
                  <Text className="text-xs text-neutral-400 font-poppins-regular mt-1">
                    {isEqualizerEnabled ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </View>
            </View>... {/* Presets Card */}
            {presets.length > 0 && (
              <View className="bg-neutral-900 rounded-2xl px-4 py-3 mb-3">
                <Text className="text-base text-white font-poppins-bold mb-2">
                  Presets
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-3 pr-4">
                    {presets.map((preset, index) => (
                      <Animated.View key={preset.id} style={{
                        transform: [{ scale: presetAnimations[preset.id] || 1 }],
                      }}>
                        <TouchableOpacity
                          className={`px-4 py-2 rounded-xl ${
                            currentPreset === preset.id 
                              ? 'bg-white shadow-lg' 
                              : 'bg-neutral-700 border border-neutral-600'
                          }`}
                          onPress={() => selectPreset(preset.id)}
                          style={{
                            shadowColor: currentPreset === preset.id ? '#FFFFFF' : 'transparent',
                            shadowOffset: {width: 0, height: 2},
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                            elevation: currentPreset === preset.id ? 8 : 0,
                            // Add smooth transition for background color
                            transition: 'background-color 0.3s ease-in-out',
                          }}
                        >
                          <Text 
                            className={`text-sm ${
                              currentPreset === preset.id 
                                ? 'text-black font-poppins-bold' 
                                : 'text-white font-poppins-medium'
                            }`}>
                            {preset.name}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Visual EQ Card */}
            <View className="bg-neutral-900 rounded-2xl px-4 py-3 mb-3">
              <Text className="text-base text-white font-poppins-bold mb-3">
                Frequency Visualization
              </Text>
              <View className="flex-row justify-between items-end px-2" style={{height: 120}}>
                {bandLevels.map((band, index) => {
                  const height = getSliderVisualHeight(band.level, bandLevelRange) * 100;
                  const color = getBandColor(band.centerFreq, band.level, bandLevelRange);
                  
                  return (
                    <View key={band.id} className="items-center flex-1 mx-1">
                      {/* Animated bar */}
                      <Animated.View 
                        className="w-full rounded-t-lg relative overflow-hidden"
                        style={{
                          height: Math.max(12, height),
                          backgroundColor: isEqualizerEnabled ? color : '#4B5563',
                          opacity: isEqualizerEnabled ? 1 : 0.5,
                          transform: [
                            { scaleY: barAnimations[index] || 1 },
                          ],
                          // Add spring animation for height changes
                          transition: 'height 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}
                      >
                        {/* Glow effect */}
                        {isEqualizerEnabled && (
                          <Animated.View 
                            className="absolute inset-0 rounded-t-lg"
                            style={{
                              backgroundColor: color,
                              opacity: 0.3,
                              shadowColor: color,
                              shadowOffset: {width: 0, height: 0},
                              shadowOpacity: 0.8,
                              shadowRadius: 4,
                              elevation: 4,
                            }}
                          />
                        )}
                      </Animated.View>
                      
                      {/* Frequency label */}
                      <Text className="text-xs text-neutral-400 font-poppins-medium mt-2 text-center">
                        {formatFrequency(band.centerFreq)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Frequency Controls Card - Now non-scrollable */}
            <View className="bg-neutral-900 rounded-2xl px-4 py-3">
              <Text className="text-base text-white font-poppins-bold mb-3">
                Frequency Controls
              </Text>
              
              {/* Removed ScrollView to make non-scrollable */}
              <View className="flex-1">
                {bandLevels.map((band, index) => {
                  const color = getBandColor(band.centerFreq, band.level, bandLevelRange);
                  const dbValue = (band.level / 100).toFixed(1);
                  
                  return (
                    <View key={band.id} className="mb-4">
                      {/* Frequency and dB display */}
                      <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center">
                          <View 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{backgroundColor: isEqualizerEnabled ? color : '#6B7280'}}
                          />
                          <Text className="text-white text-sm font-poppins-semibold">
                            {formatFrequency(band.centerFreq)} Hz
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Text 
                            className="text-sm font-poppins-bold mr-2"
                            style={{color: isEqualizerEnabled ? color : '#9CA3AF'}}
                          >
                            {dbValue.includes('-') ? '' : '+'}{dbValue}
                          </Text>
                          <Text className="text-neutral-400 text-xs font-poppins-regular">
                            dB
                          </Text>
                        </View>
                      </View>
                      
                      {/* Enhanced Slider */}
                      <View className="relative overflow-hidden">
                        <View className="overflow-hidden">
                          <Slider
                            className="w-full h-10"
                            minimumValue={bandLevelRange[0]}
                            maximumValue={bandLevelRange[1]}
                            value={sliderAnimations[band.id] ? sliderAnimations[band.id].__getValue() : band.level}
                            minimumTrackTintColor={isEqualizerEnabled ? color : '#6B7280'}
                            maximumTrackTintColor="#374151"
                            thumbTintColor={isEqualizerEnabled ? '#FFFFFF' : '#9CA3AF'}
                            onValueChange={value =>
                              adjustBandLevel(band.id, Math.round(value))
                            }
                            disabled={!isEqualizerEnabled}
                          />
                        </View>
                      </View>... {/* Zero line indicator */}
                      <View className="flex-row justify-center mt-1">
                        <View className="w-px h-1 bg-neutral-600" />
                        <Text className="text-xs text-neutral-500 font-poppins-regular ml-1">
                          0
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Save Button Card */}
            <TouchableOpacity 
              className="bg-white rounded-2xl px-4 py-3 mt-3 items-center"
              style={{
                shadowColor: '#000000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Icon name="save-outline" size={18} color="#000000" />
                <Text className="text-sm text-black font-poppins-bold ml-2">
                  Save Settings
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Dashboard;
