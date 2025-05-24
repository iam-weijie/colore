import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Platform } from 'react-native';
import { DEFAULT_SHORTHAND_EMOJIS } from '@/constants/emojiLibrary';

interface EmojiShorthandProps {
  onEmojiSelected: (emoji: string) => void;
  selectedEmoji?: string | null;
  customShorthandEmojis?: string[];
}

const EmojiShorthand: React.FC<EmojiShorthandProps> = ({
  onEmojiSelected,
  selectedEmoji,
  customShorthandEmojis
}) => {
  const shorthandEmojis = customShorthandEmojis || DEFAULT_SHORTHAND_EMOJIS;

  const renderEmojiItem = ({ item: emoji, index }: { item: string; index: number }) => (
    <TouchableOpacity
      key={`shorthand-${index}`}
      onPress={() => onEmojiSelected(emoji)}
      className={`w-14 h-14 rounded-full items-center justify-center mx-1.5 ${
        selectedEmoji === emoji
          ? 'bg-blue-100 border-2 border-blue-500'
          : 'bg-gray-50 border border-gray-200'
      }`}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 24 }}>
        {emoji}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    }}>
      <Text className="text-lg font-JakartaBold text-center mb-4 text-gray-800">
        Quick Reactions
      </Text>

      <View style={{ height: 70 }}>
        <FlatList
          data={shorthandEmojis}
          renderItem={renderEmojiItem}
          keyExtractor={(item, index) => `shorthand-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 8,
            alignItems: 'center'
          }}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          scrollEnabled={true}
          bounces={Platform.OS === 'ios'}
          overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
          removeClippedSubviews={false}
          style={{ flexGrow: 0 }}
        />
      </View>
    </View>
  );
};

export default EmojiShorthand;
