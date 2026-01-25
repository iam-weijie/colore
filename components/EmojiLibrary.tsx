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
import { Ionicons } from '@expo/vector-icons';
import InteractionButton from './InteractionButton';

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

      <View className='relative'>
      <InteractionButton 
                    label=""
                    icon={icons.wink}
                    emoji={item.emoji}
                    showLabel={true}
                    color={"#000000"}
                    onPress={() => onEmojiSelected(item.emoji)} 
                    size={selectedEmoji == item.emoji ? "lg" : "md"} 
                    styling="shadow-md"             />
                  {selectedEmoji == item.emoji  && <View className="absolute w-1 h-1 rounded-full bg-gray-400 self-center bottom-2"></View>}
                    </View>

    );
  };

  const renderCategoryItem = ({ item: category }: { item: string }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(category)}
      className={`px-4 py-2 rounded-full mx-1`}
    >
      <Text
        className={`text-md font-[Jakarta-Medium] capitalize ${
          selectedCategory === category ? 'text-black' : 'text-gray-500'
        }`}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  return (
    <View className="bg-gray-50" style={{ height: MODAL_HEIGHT }}>
      <View className="flex-1 px-6 pt-4">
      <View className=" w-full -pt-2 pb-2">
        <View className="flex flex-row items-center bg-white rounded-[24px] px-4 h-12 "
        style={{
          boxShadow: "0 0 7px 1px rgba(120,120,120,.1)"
        }}
        >
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 pl-2 text-md "
            placeholder="Search emojis..."
             placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              className="w-6 h-6 items-center justify-center"
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
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
          contentContainerStyle={{ paddingBottom: 90 }}
          showsVerticalScrollIndicator={true}
          columnWrapperStyle={{ justifyContent: 'space-around', marginBottom: 3 }}
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
        <View className='absolute self-center bottom-[72px]'>
              <InteractionButton 
                    label=""
                    icon={icons.close}
                    emoji={""}
                    showLabel={true}
                    color={"#000000"}
                    onPress={() => onEmojiSelected("")} 
                    size={"lg"}              />
        </View>
      </View>
    </View>
  );
};

export default EmojiLibrary;
