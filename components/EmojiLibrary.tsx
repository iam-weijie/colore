import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { EMOJI_LIBRARY, EMOJI_CATEGORIES, EmojiData } from '@/constants/emojiLibrary';
import { icons } from '@/constants';
import { Image } from 'react-native';

interface EmojiLibraryProps {
  onEmojiSelected: (emoji: string) => void;
  selectedEmoji?: string | null;
}

const { width, height } = Dimensions.get('window');
const EMOJI_SIZE = 48;
const EMOJIS_PER_ROW = Math.floor((width - 80) / (EMOJI_SIZE + 12));
const MODAL_HEIGHT = height * 0.75;

const EmojiLibrary: React.FC<EmojiLibraryProps> = ({
  onEmojiSelected,
  selectedEmoji,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredEmojis = useMemo(() => {
    let filtered = EMOJI_LIBRARY;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((emoji) =>
        emoji.categories.includes(selectedCategory)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((emoji) =>
        emoji.categories.some((category) =>
          category.toLowerCase().includes(query)
        ) || emoji.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const renderEmojiItem = ({ item }: { item: EmojiData }) => {
    const isSelected = selectedEmoji === item.emoji;

    return (
      <TouchableOpacity
        onPress={() => onEmojiSelected(item.emoji)}
        className={`w-[48px] h-[48px] m-[6px] items-center justify-center rounded-xl border-2 ${
          isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'
        }`}
        activeOpacity={0.7}
      >
        <Text className="text-[28px]">{item.emoji}</Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryItem = ({ item: category }: { item: string }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(category)}
      className={`px-4 py-2 rounded-full mx-1 ${
        selectedCategory === category
          ? 'bg-blue-500'
          : 'bg-white shadow shadow-black/5'
      }`}
    >
      <Text
        className={`text-xs font-[Jakarta-Medium] capitalize ${
          selectedCategory === category ? 'text-white' : 'text-gray-700'
        }`}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="bg-gray-50" style={{ height: MODAL_HEIGHT }}>
      <View className="flex-1 px-6 pt-4">
        <View className="bg-white rounded-xl flex-row items-center px-4 py-3 mb-3 shadow shadow-black/5">
          <Image source={icons.search} style={{ width: 16, height: 16, marginRight: 12 }} tintColor="#6B7280" />
          <TextInput
            placeholder="Search emojis..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-sm font-[Jakarta-Medium] text-gray-700"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="h-10 mb-4">
          <FlatList
            data={['all', ...EMOJI_CATEGORIES]}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
          />
        </View>

        <FlatList
          data={filteredEmojis}
          renderItem={renderEmojiItem}
          numColumns={EMOJIS_PER_ROW}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
          columnWrapperStyle={{ justifyContent: 'space-around', marginBottom: 8 }}
          scrollEnabled={true}
          bounces={Platform.OS === 'ios'}
          overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          maxToRenderPerBatch={20}
          windowSize={10}
          initialNumToRender={20}
          nestedScrollEnabled={false}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-10">
              <Text className="text-base font-[Jakarta-Medium] text-gray-500 text-center mb-2">
                No emojis found
              </Text>
              <Text className="text-sm font-[Jakarta-Regular] text-gray-400 text-center">
                Try adjusting your search or category filter
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
};

export default EmojiLibrary;
