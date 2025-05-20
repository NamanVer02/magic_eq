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
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-3">
          <Text className="text-2xl text-white font-poppins-bold text-center mt-2 mb-2">
            Mood Equalizer
          </Text>
          <Text className="text-base text-neutral-400 font-poppins-regular text-center mb-4">
            Tell us how you feel, and we'll create the perfect sound for you
          </Text>
        </View>

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
            className="bg-white rounded-full py-4 items-center mt-4 mb-4"
            onPress={generateEqualizer}>
            <Text className="text-base text-black font-poppins-semibold">
              Generate Equalizer
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Moods;
