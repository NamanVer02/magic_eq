/**
 * Magic Equalizer Demo App
 */

import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  Platform,
  View,
  Text,
} from 'react-native';
import {styled} from 'nativewind';
import Dashboard from './src/screens/Dashboard';
import Moods from './src/screens/Moods';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledSafeAreaView = styled(SafeAreaView);

function App(): React.JSX.Element {
  // Hide navigation bar on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setHidden(true);
      // This would normally be done with native modules, but here we're just hiding the status bar
    }
  }, []);

  return (
    <StyledSafeAreaView className="flex-1 bg-black">
      <StatusBar hidden={true} />

      {Platform.OS === 'android' ? (
        <Dashboard />
        // <Moods />
      ) : (
        <StyledView className="flex-1 justify-center items-center p-5 bg-black">
          <StyledText className="text-base text-center text-white">
            The Equalizer API is currently only supported on Android devices.
          </StyledText>
        </StyledView>
      )}
    </StyledSafeAreaView>
  );
}

export default App;
