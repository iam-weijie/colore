import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Platform } from 'react-native';
import { DEFAULT_SHORTHAND_EMOJIS } from '@/constants/emojiLibrary';
import InteractionButton from './InteractionButton';
import { icons } from '@/constants';

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

  const renderEmojiItem = ({ item: emoji, index }: { item: string; index: number }) => {

    return (
      <View key={`shorthand-${index} `}>
         <InteractionButton 
                    label=""
                    icon={icons.wink}
                    emoji={emoji}
                    showLabel={false}
                    color={"#000000"}
                    onPress={() => onEmojiSelected(emoji)} 
                    size={"sm"}
                    styling=""              />
                    </View>
  )}

  return (
    <View>


      <View style={{ height: 120 }} className='w-12 rounded-[32px] bg-white py-2' >
        <FlatList
          data={shorthandEmojis}
          className='rounded-[32px] '
          renderItem={renderEmojiItem}
          keyExtractor={(item, index) => `shorthand-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'center',
            justifyContent: 'center'
          }}
          scrollEnabled={true}
          bounces={Platform.OS === 'ios'}
          overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
          removeClippedSubviews={false}
        />
      </View>
    </View>
  );
};

export default EmojiShorthand;
