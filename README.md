# Magic Equalizer Demo App

A React Native application demonstrating how to use the Android Equalizer API to control the device's audio equalizer.

## Features

- Control the Android device's audio equalizer
- Adjust individual frequency bands
- Select from available preset equalizer settings
- Toggle equalizer on/off
- Simple audio player for testing

## Requirements

- React Native 0.79.1 or higher
- Android device or emulator (not supported on iOS)
- Android API level 19 or higher

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/magic_eq.git
cd magic_eq
```

2. Install dependencies:
```bash
npm install
```

3. Link native modules:
```bash
npx react-native-asset
```

4. Add a sample audio file (optional):
To test with audio playback, add an audio file named `sample.wav` or `sample.mp3` to:
```
android/app/src/main/res/raw/
```

## Running the App

To run the application on an Android device or emulator:

```bash
npm run android
```

## How It Works

This demo app uses the Android [Equalizer API](https://developer.android.com/reference/android/media/audiofx/Equalizer) through a custom React Native native module. The native module is implemented in Kotlin and exposed to JavaScript through React Native's bridge.

### Key Components:

1. **EqualizerModule.kt** - Native Kotlin module that interfaces with the Android Equalizer API
2. **EqualizerPackage.kt** - Registers the native module with React Native
3. **EqualizerModule.ts** - TypeScript interface for the native module
4. **EqualizerView.tsx** - React Native UI component for controlling the equalizer
5. **AudioPlayer.tsx** - Simple audio player for testing the equalizer

### Native Module API

The native module exposes the following methods:

- `initialize(audioSessionId: number)` - Initialize the equalizer for a specific audio session
- `release()` - Release equalizer resources
- `setEnabled(enabled: boolean)` - Enable or disable the equalizer
- `isEnabled()` - Check if the equalizer is enabled
- `getNumberOfBands()` - Get the number of frequency bands
- `getBandFreqRange(band: number)` - Get the frequency range for a band
- `getCenterFreq(band: number)` - Get the center frequency for a band
- `getBandLevel(band: number)` - Get the gain level for a band
- `setBandLevel(band: number, level: number)` - Set the gain level for a band
- `getBandLevelRange()` - Get the min/max values for band levels
- `getNumberOfPresets()` - Get the number of available presets
- `getPresetName(preset: number)` - Get the name of a preset
- `usePreset(preset: number)` - Apply a preset
- `getCurrentPreset()` - Get the current preset
- `getAllPresets()` - Get all available presets
- `getAllBandLevels()` - Get levels for all bands

## Customizing

### Adding Your Own Audio Files

To test with your own audio files:

1. Add audio files to `android/app/src/main/res/raw/`
2. Update the AudioPlayer component to use your files

### Extending the Equalizer

To add more features:

1. Extend the native module with additional methods
2. Update the TypeScript interface
3. Add new UI controls in the React components

## Limitations

- This demo only supports Android, as iOS does not provide a public API for system-wide equalizer control
- The equalizer affects all audio output on the device, not just the demo app
- Some devices may not support all equalizer features or may have limitations

## License

MIT
