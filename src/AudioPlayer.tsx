import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Sound from 'react-native-sound';
import EqualizerModule from './EqualizerModule';

// Enable playback in silence mode
Sound.setCategory('Playback');

const DEFAULT_AUDIO_SESSION_ID = 0;

const AudioPlayer: React.FC = () => {
  const [sound, setSound] = useState<Sound | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasSoundFile, setHasSoundFile] = useState<boolean>(false);
  
  useEffect(() => {
    const loadSound = async () => {
      try {
        setIsLoading(true);
        
        // Load the sample sound
        // Note: In a real app, you would include actual audio files
        const sample = new Sound('sample.wav', Sound.MAIN_BUNDLE, (error) => {
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
      
      sound.play((success) => {
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
    sound.play((success) => {
      if (!success) {
        Alert.alert('Error', 'Failed to play sound');
      }
      setIsPlaying(false);
    });
    
    setIsPlaying(true);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Player</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#4285F4" />
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.button}
            onPress={togglePlayback}
          >
            <Text style={styles.buttonText}>
              {hasSoundFile 
                ? (isPlaying ? 'Pause' : 'Play') 
                : 'Initialize Equalizer'}
            </Text>
          </TouchableOpacity>
          
          {isPlaying && hasSoundFile && (
            <TouchableOpacity
              style={styles.button}
              onPress={restartPlayback}
            >
              <Text style={styles.buttonText}>Restart</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {!hasSoundFile && !isLoading && (
        <Text style={styles.warning}>
          No audio file found. For a real app, add audio files to android/app/src/main/res/raw/.
          {'\n\n'}
          You can still test the equalizer without audio playback.
        </Text>
      )}
      
      <Text style={styles.info}>
        Use the equalizer controls below to adjust the audio
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  warning: {
    fontSize: 14,
    color: '#E53935',
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
});

export default AudioPlayer; 