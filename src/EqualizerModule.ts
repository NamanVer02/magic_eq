import { NativeModules, Platform } from 'react-native';

const { EqualizerModule } = NativeModules;

interface Preset {
  id: number;
  name: string;
}

interface BandLevel {
  id: number;
  level: number;
  centerFreq: number;
}

interface EqualizerInterface {
  initialize(audioSessionId: number): Promise<boolean>;
  release(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  getNumberOfBands(): Promise<number>;
  getBandFreqRange(band: number): Promise<number[]>;
  getCenterFreq(band: number): Promise<number>;
  getBandLevel(band: number): Promise<number>;
  setBandLevel(band: number, level: number): Promise<boolean>;
  getBandLevelRange(): Promise<number[]>;
  getNumberOfPresets(): Promise<number>;
  getPresetName(preset: number): Promise<string>;
  usePreset(preset: number): Promise<boolean>;
  getCurrentPreset(): Promise<number>;
  getAllPresets(): Promise<Preset[]>;
  getAllBandLevels(): Promise<BandLevel[]>;
}

// Fallback implementation for iOS or platforms where the native module is not available
const mockModule: EqualizerInterface = {
  initialize: async () => {
    console.warn('Equalizer not available on this platform');
    return false;
  },
  release: async () => {
    console.warn('Equalizer not available on this platform');
    return false;
  },
  setEnabled: async () => {
    console.warn('Equalizer not available on this platform');
    return false;
  },
  isEnabled: async () => {
    console.warn('Equalizer not available on this platform');
    return false;
  },
  getNumberOfBands: async () => {
    console.warn('Equalizer not available on this platform');
    return 0;
  },
  getBandFreqRange: async () => {
    console.warn('Equalizer not available on this platform');
    return [0, 0];
  },
  getCenterFreq: async () => {
    console.warn('Equalizer not available on this platform');
    return 0;
  },
  getBandLevel: async () => {
    console.warn('Equalizer not available on this platform');
    return 0;
  },
  setBandLevel: async () => {
    console.warn('Equalizer not available on this platform');
    return false;
  },
  getBandLevelRange: async () => {
    console.warn('Equalizer not available on this platform');
    return [0, 0];
  },
  getNumberOfPresets: async () => {
    console.warn('Equalizer not available on this platform');
    return 0;
  },
  getPresetName: async () => {
    console.warn('Equalizer not available on this platform');
    return '';
  },
  usePreset: async () => {
    console.warn('Equalizer not available on this platform');
    return false;
  },
  getCurrentPreset: async () => {
    console.warn('Equalizer not available on this platform');
    return -1;
  },
  getAllPresets: async () => {
    console.warn('Equalizer not available on this platform');
    return [];
  },
  getAllBandLevels: async () => {
    console.warn('Equalizer not available on this platform');
    return [];
  },
};

// Export the appropriate module based on the platform
export default Platform.OS === 'android' && EqualizerModule
  ? EqualizerModule as EqualizerInterface
  : mockModule;

export type { Preset, BandLevel }; 