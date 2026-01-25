import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { Image } from 'react-native';
import { EMOJI_LIBRARY, DEFAULT_SHORTHAND_EMOJIS, EmojiData, EMOJI_CATEGORIES } from '@/constants/emojiLibrary';
import { useAlert } from '@/notifications/AlertContext';
import { useEmojiPreferences } from '@/hooks/useEmojiPreferences';
import { icons } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import InteractionButton from './InteractionButton';

const { width, height } = Dimensions.get('window');
const EMOJI_SIZE = 44;
const EMOJIS_PER_ROW = Math.floor((width - 80) / (EMOJI_SIZE + 8));
const MODAL_HEIGHT = height * 0.75;
const BUTTON_HEIGHT = 80;

const EmojiSettings = ({ onClose }) => {
  const { showAlert } = useAlert();
  const { shorthandEmojis, saveEmojiPreferences, resetEmojiPreferences } = useEmojiPreferences();
  const [selectedEmojis, setSelectedEmojis] = useState(DEFAULT_SHORTHAND_EMOJIS);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    setSelectedEmojis(shorthandEmojis);
  }, [shorthandEmojis]);

  const filteredEmojis = useMemo(() => {
    let filtered = EMOJI_LIBRARY;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((emoji) => emoji.categories.includes(selectedCategory));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((emoji) =>
        emoji.categories.some((category) => category.toLowerCase().includes(query)) ||
        emoji.id.toLowerCase().includes(query)
      );
    }
    const selectedEmojiObjects = filtered.filter((emoji) => selectedEmojis.includes(emoji.emoji));
    const unselectedEmojiObjects = filtered.filter((emoji) => !selectedEmojis.includes(emoji.emoji));
    return [...selectedEmojiObjects, ...unselectedEmojiObjects];
  }, [searchQuery, selectedCategory, selectedEmojis]);

  const handleEmojiSelect = (emoji) => {
    if (selectedEmojis.includes(emoji)) {
      setSelectedEmojis((prev) => prev.filter((e) => e !== emoji));
    } else if (selectedEmojis.length < 6) {
      setSelectedEmojis((prev) => [...prev, emoji]);
    } else {
      showAlert({
        title: 'Maximum Reached',
        message: 'You can only select up to 6 emojis for quick reactions.',
        type: 'WARNING',
        status: 'warning',
      });
    }
  };

  const handleSave = async () => {
    if (selectedEmojis.length !== 6) {
      showAlert({
        title: 'Incomplete Selection',
        message: 'Please select exactly 6 emojis for your quick reactions.',
        type: 'WARNING',
        status: 'warning',
      });
      return;
    }

    try {
      setSaving(true);
      const success = await saveEmojiPreferences(selectedEmojis);

      if (success) {
        showAlert({
          title: 'Success',
          message: 'Your emoji preferences have been saved to this device!',
          type: 'SUCCESS',
          status: 'success',
        });
        if (onClose) setTimeout(onClose, 1500);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error(err);
      showAlert({
        title: 'Error',
        message: 'Failed to save your emoji preferences. Please try again.',
        type: 'ERROR',
        status: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset to Default', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setSelectedEmojis([...DEFAULT_SHORTHAND_EMOJIS]);
          await resetEmojiPreferences();
        },
      },
    ]);
  };

    const handleClearSearch = () => {
    setSearchQuery("")
  }

  const renderPreviewSlot = (index) => (
    <View
      key={`slot-${index}`}
      className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
        selectedEmojis[index] ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'
      }`}
    >
      {selectedEmojis[index] ? (
        <Text className="text-lg">{selectedEmojis[index]}</Text>
      ) : (
        <Text className="text-xs font-[Jakarta-Medium] text-gray-400">{index + 1}</Text>
      )}
    </View>
  );

  const renderEmojiItem = ({ item }) => {
    const isSelected = selectedEmojis.includes(item.emoji);
    const selectionIndex = selectedEmojis.indexOf(item.emoji);
    return (
      <View className='relative'>
      <InteractionButton 
                    label=""
                    icon={icons.wink}
                    emoji={item.emoji}
                    showLabel={true}
                    color={"#000000"}
                    onPress={() => handleEmojiSelect(item.emoji)} 
                    size={"sm"} 
                    styling="shadow-md"             />
        {isSelected && (
          <View className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
            <Text className="text-[10px] font-[Jakarta-Bold] text-white">{selectionIndex + 1}</Text>
          </View>
        )}
        </View>
    );
  };

  const renderCategoryItem = ({ item: category }) => (
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

  return (
    <View className="bg-gray-50" style={{ height: MODAL_HEIGHT }}>
      <View className="flex-1 px-6 pt-4 pb-20">
        <View className="mb-4">
          <Text className="text-sm font-[Jakarta-Regular] text-gray-500 text-center w-[75%] mx-auto mb-2">
            Select 6 emojis for your quick reaction shortcuts
          </Text>
        </View>

        <View className="bg-white rounded-[32px] p-4 mb-4 shadow-md">
          <Text className="text-xs font-[Jakarta-Medium] text-gray-700 mb-3">
            Selected ({selectedEmojis.length}/6):
          </Text>
          <View className="flex-row flex-wrap justify-center gap-2">
            {Array.from({ length: 6 }).map((_, index) => renderPreviewSlot(index))}
          </View>
        </View>

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
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
          columnWrapperStyle={{ justifyContent: 'space-around', marginBottom: 8, paddingTop: 16 }}
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

      <View className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50 border-t border-gray-200 px-6 py-4 flex-row items-center gap-4 z-50">
        <TouchableOpacity
          onPress={handleReset}
          className="flex-1 py-3 rounded-xl bg-gray-100 items-center justify-center"
          disabled={saving}
        >
          <Text className="text-base font-[Jakarta-Medium] text-gray-700">Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          className={`flex-1 py-3 rounded-xl items-center justify-center ${
            selectedEmojis.length === 6 && !saving ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          disabled={selectedEmojis.length !== 6 || saving}
        >
          <Text
            className={`text-base font-[Jakarta-Medium] ${
              selectedEmojis.length === 6 && !saving ? 'text-white' : 'text-gray-400'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmojiSettings;
