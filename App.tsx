/**
 * Magic Equalizer Demo App
 */

import React, {useEffect} from 'react';
import {
  StatusBar,
  Platform,
  View,
  Text,
} from 'react-native';
import {styled} from 'nativewind';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Dashboard from './src/screens/Dashboard';
import Moods from './src/screens/Moods';
import PagerView from 'react-native-pager-view';

const StyledView = styled(View);
const StyledText = styled(Text);

// Define the stack navigator param list
export type RootStackParamList = {
  Dashboard: undefined;
  Moods: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  // Hide navigation bar on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setHidden(true);
      // This would normally be done with native modules, but here we're just hiding the status bar
    }
  }, []);

  const [page, setPage] = React.useState(0);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar hidden={true} />

      {Platform.OS === 'android' ? (
        <PagerView style={{flex: 1}} initialPage={0} onPageSelected={e => setPage(e.nativeEvent.position)}>
          <View key="1" style={{flex: 1}}>
            <Dashboard />
          </View>
          <View key="2" style={{flex: 1}}>
            <Moods />
          </View>
        </PagerView>
      ) : (
        <StyledView className="flex-1 justify-center items-center p-5 bg-black">
          <StyledText className="text-base text-center text-white">
            The Equalizer API is currently only supported on Android devices.
          </StyledText>
        </StyledView>
      )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
