import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Define types
interface Mood {
  id: string;
  emoji: string;
  label: string;
}

import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../App';

type MoodsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Moods'>;

const Moods: React.FC<{navigation: MoodsScreenNavigationProp}> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState<string>('relaxed');
  const [customMood, setCustomMood] = useState<string>(
    'I need to relax after a stressful day',
  );
  const [showResult, setShowResult] = useState<boolean>(true);

  const moods: Mood[] = [
    {id: 'happy', emoji: '😊', label: 'Happy'},
    {id: 'relaxed', emoji: '😌', label: 'Relaxed'},
    {id: 'sad', emoji: '😔', label: 'Sad'},
    {id: 'energetic', emoji: '😤', label: 'Energetic'},
    {id: 'sleepy', emoji: '😴', label: 'Sleepy'},
    {id: 'focused', emoji: '🧠', label: 'Focused'},
    {id: 'confident', emoji: '😎', label: 'Confident'},
    {id: 'romantic', emoji: '🥰', label: 'Romantic'},
    {id: 'more', emoji: '✨', label: 'More'},
  ];

  const handleMoodSelection = (moodId: string): void => {
    setSelectedMood(moodId);
  };

  const generateEqualizer = (): void => {
    setShowResult(true);
  };

  const applyToEqualizer = (): void => {
    // Logic to apply the preset to the main equalizer
    navigation.navigate('Dashboard');
  };

  const renderMoodItem = (mood: Mood): React.ReactElement => (
    <TouchableOpacity
      key={mood.id}
      className={`w-[30%] bg-neutral-800 border border-neutral-700 rounded-xl p-4 mb-3 items-center ${
        selectedMood === mood.id ? 'bg-white' : ''
      }`}
      onPress={() => handleMoodSelection(mood.id)}>
      <Text className="text-2xl mb-2">{mood.emoji}</Text>
      <Text
        className={`text-sm font-poppins-medium ${
          selectedMood === mood.id ? 'text-black' : 'text-white'
        }`}>
        {mood.label}
      </Text>
    </TouchableOpacity>
  );

  const renderEqualizerBar = (height: string): React.ReactElement => (
    <View className={`w-[8%] h-[${height}] bg-white rounded-t-sm`} />
  );

  return (
    <SafeAreaView className="flex-1 bg-black pt-2">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }}>
        {/* Header */}
        <Text className="text-2xl text-white font-poppins-bold text-center mt-5 mb-2">
          Mood Equalizer
        </Text>
        <Text className="text-base text-neutral-400 font-poppins-regular text-center mb-8">
          Tell us how you feel, and we'll create the perfect sound for you
        </Text>

        {/* Mood Selection Section */}
        <View className="mb-8">
          <Text className="text-lg text-white font-poppins-semibold mb-4">
            Choose your mood:
          </Text>

          {/* Mood Grid */}
          <View className="flex-row flex-wrap justify-between">
            {moods.map(renderMoodItem)}
          </View>

          {/* Custom Mood Input */}
          <View className="mt-6">
            <Text className="text-lg text-white font-poppins-semibold mb-4">
              Or describe how you feel:
            </Text>
            <TextInput
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-white p-4 text-base font-poppins-regular mb-4"
              placeholder="E.g., 'I want to feel motivated while working out'"
              placeholderTextColor="#999"
              value={customMood}
              onChangeText={setCustomMood}
              multiline
            />
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            className="bg-white rounded-full py-4 items-center mt-4 mb-2"
            onPress={generateEqualizer}>
            <Text className="text-base text-black font-poppins-semibold">
              Generate Equalizer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {showResult && (
          <View className="bg-neutral-800 rounded-xl p-5 mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl text-white font-poppins-bold">
                Relaxation Preset
              </Text>
              <TouchableOpacity className="border border-white rounded-full px-4 py-2">
                <Text className="text-sm text-white font-poppins-regular">
                  Save Preset
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-neutral-400 text-sm font-poppins-regular leading-5 mb-5">
              This equalizer setting enhances low frequencies for a warm,
              calming sound while reducing harsh high frequencies to help you
              unwind and de-stress.
            </Text>

            {/* Equalizer Visualization */}
            <View className="h-30 bg-neutral-700 rounded-lg mb-5 overflow-hidden flex-row justify-between items-end px-2">
              {/* Explicit style objects instead of dynamic className for type safety */}
              <View className="w-[8%] h-[75%] bg-white rounded-t-sm" />
              <View className="w-[8%] h-[60%] bg-white rounded-t-sm" />
              <View className="w-[8%] h-[45%] bg-white rounded-t-sm" />
              <View className="w-[8%] h-[35%] bg-white rounded-t-sm" />
              <View className="w-[8%] h-[30%] bg-white rounded-t-sm" />
              <View className="w-[8%] h-[25%] bg-white rounded-t-sm" />
              <View className="w-[8%] h-[20%] bg-white rounded-t-sm" />
              <View className="w-[8%] h-[15%] bg-white rounded-t-sm" />
              <View className="w-[8%] h-[10%] bg-white rounded-t-sm" />
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              className="bg-white rounded-full py-4 items-center"
              onPress={applyToEqualizer}>
              <Text className="text-base text-black font-poppins-semibold">
                Apply to Equalizer
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation Buttons */}
        <View className="flex-row justify-between mb-8 pb-8">
          <TouchableOpacity
            className="border border-neutral-700 rounded-full px-5 py-3"
            onPress={() => navigation.navigate('Dashboard')}>
            <Text className="text-sm text-white font-poppins-regular">
              Back to Player
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white rounded-full px-5 py-3">
            <Text className="text-sm text-black font-poppins-medium">
              View All Presets
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Moods;
