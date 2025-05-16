import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  NativeModules,
  DeviceEventEmitter,
  Image,
} from 'react-native';
import Sound from 'react-native-sound';
import EqualizerModule from './EqualizerModule';

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

const AudioPlayer: React.FC = () => {
  const [sound, setSound] = useState<Sound | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasSoundFile, setHasSoundFile] = useState<boolean>(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isEqualizerEnabled, setIsEqualizerEnabled] = useState<boolean>(false);

  useEffect(() => {
    const loadSound = async () => {
      try {
        setIsLoading(true);

        // Load the sample sound
        // Note: In a real app, you would include actual audio files
        const sample = new Sound('sample.wav', Sound.MAIN_BUNDLE, error => {
          if (error) {
            console.warn('Failed to load sound: ', error);
            setHasSoundFile(false);
            setIsLoading(false);
            // Still initialize equalizer even without sound
            EqualizerModule.initialize(DEFAULT_AUDIO_SESSION_ID);
            return;
          }

          setSound(sample);
          setHasSoundFile(true);
          setIsLoading(false);
        });
      } catch (error) {
        setIsLoading(false);
        setHasSoundFile(false);
        console.warn('Failed to load sound: ', error);
        // Still initialize equalizer even without sound
        EqualizerModule.initialize(DEFAULT_AUDIO_SESSION_ID);
      }
    };

    loadSound();

    // Cleanup on unmount
    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, []);

  // Initialize the media detection and equalizer
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true);

        if (Platform.OS === 'android') {
          // Initialize the equalizer with default audio session
          // (it will detect active audio sessions)
          await EqualizerModule.initialize(DEFAULT_AUDIO_SESSION_ID);

          // Check if equalizer is enabled
          const enabled = await EqualizerModule.isEnabled();
          setIsEqualizerEnabled(enabled);

          // If we had a NativeModule for media session we would listen to updates
          // This is a placeholder where you'd implement the actual module
          if (NativeModules.MediaSessionModule) {
            NativeModules.MediaSessionModule.startListening();
            DeviceEventEmitter.addListener(
              'onMediaSessionUpdate',
              handleMediaUpdate,
            );
          } else {
            // For demonstration, set dummy data since we don't have the actual module
            setDummyMediaInfo();
          }
        }

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        Alert.alert('Error', `Failed to initialize audio detection: ${error}`);
      }
    };

    initializeAudio();

    // Cleanup on unmount
    return () => {
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

  const togglePlayback = () => {
    if (!sound || !hasSoundFile) {
      // For demo purposes, initialize equalizer even without sound
      EqualizerModule.initialize(DEFAULT_AUDIO_SESSION_ID);
      return;
    }

    if (isPlaying) {
      sound.pause();
      setIsPlaying(false);
    } else {
      // Initialize equalizer before playing
      EqualizerModule.initialize(DEFAULT_AUDIO_SESSION_ID);

      sound.play(success => {
        if (!success) {
          Alert.alert('Error', 'Failed to play sound');
        }
        setIsPlaying(false);
      });

      setIsPlaying(true);
    }
  };

  const restartPlayback = () => {
    if (!sound || !hasSoundFile) return;

    sound.stop();
    sound.play(success => {
      if (!success) {
        Alert.alert('Error', 'Failed to play sound');
      }
      setIsPlaying(false);
    });

    setIsPlaying(true);
  };

  // Toggle equalizer enabled state
  const toggleEqualizer = async () => {
    try {
      const current = await EqualizerModule.isEnabled();
      await EqualizerModule.setEnabled(!current);
      setIsEqualizerEnabled(!current);
    } catch (error) {
      Alert.alert('Error', `Failed to toggle equalizer: ${error}`);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Now Playing</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#FFFFFF" />
      ) : mediaInfo ? (
        <View style={styles.mediaContainer}>
          <View style={styles.albumContainer}>
            {mediaInfo.artwork ? (
              <Image
                source={{uri: mediaInfo.artwork}}
                style={styles.albumArt}
              />
            ) : (
              <View style={styles.placeholderArt}>
                <Text style={styles.placeholderText}>
                  {mediaInfo.title?.charAt(0) ||
                    mediaInfo.artist?.charAt(0) ||
                    '♫'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {mediaInfo.title || 'Unknown Title'}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {mediaInfo.artist || 'Unknown Artist'}
            </Text>
            <Text style={styles.appName}>
              via {getAppName(mediaInfo.packageName)}
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.iconText}>⏮</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>
                {mediaInfo.isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.iconText}>⏭</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.equalizerButton,
              isEqualizerEnabled && styles.equalizerButtonActive,
            ]}
            onPress={toggleEqualizer}>
            <Text
              style={[
                styles.equalizerButtonText,
                isEqualizerEnabled && styles.equalizerButtonTextActive,
              ]}>
              Equalizer: {isEqualizerEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noMediaContainer}>
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholderArt}>
              <Text style={styles.placeholderText}>♫</Text>
            </View>
          </View>

          <Text style={styles.noMediaText}>No media playing</Text>
          <Text style={styles.noMediaSubtext}>
            Start playing music in any app like Spotify, YouTube Music, or your
            favorite player.
          </Text>

          <TouchableOpacity
            style={[
              styles.equalizerButton,
              isEqualizerEnabled && styles.equalizerButtonActive,
            ]}
            onPress={toggleEqualizer}>
            <Text
              style={[
                styles.equalizerButtonText,
                isEqualizerEnabled && styles.equalizerButtonTextActive,
              ]}>
              Equalizer: {isEqualizerEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  mediaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  albumContainer: {
    marginBottom: 25,
  },
  albumArt: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#333333',
  },
  placeholderArt: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
  },
  placeholderContainer: {
    marginBottom: 25,
  },
  placeholderText: {
    fontSize: 60,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  songTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 18,
    color: '#BBBBBB',
    marginBottom: 6,
    textAlign: 'center',
  },
  appName: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  controlButton: {
    padding: 10,
    marginHorizontal: 20,
  },
  iconText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  playButtonText: {
    fontSize: 24,
    color: '#000000',
  },
  equalizerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#333333',
    marginTop: 10,
  },
  equalizerButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  equalizerButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  equalizerButtonTextActive: {
    color: '#000000',
  },
  noMediaContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noMediaText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  noMediaSubtext: {
    fontSize: 14,
    color: '#BBBBBB',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default AudioPlayer;
