import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import EmojiShorthand from './EmojiShorthand';
import EmojiLibrary from './EmojiLibrary';
import ModalSheet from './Modal';
import RecentEmojiPopup from './RecentEmojiPopup';
import { useEmojiPreferences } from '@/hooks/useEmojiPreferences';
import { useRecentEmojis } from '@/hooks/useRecentEmojis';

interface EmojiSelectorProps {
  onEmojiSelected: (emoji: string) => void;
  selectedEmoji?: string | null;
  mode?: 'shorthand' | 'library' | 'both';
  showInModal?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
}

const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  onEmojiSelected,
  selectedEmoji,
  mode = 'both',
  showInModal = false,
  isVisible = true,
  onClose
}) => {
  const [currentMode, setCurrentMode] = useState<'shorthand' | 'library'>(
    mode === 'both' ? 'shorthand' : mode
  );
  const [showRecentPopup, setShowRecentPopup] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<TouchableOpacity>(null);

  const { shorthandEmojis } = useEmojiPreferences();
  const { recentEmojis, addRecentEmoji } = useRecentEmojis();

  const handleEmojiSelect = async (emoji: string) => {
    // Add to recent emojis
    await addRecentEmoji(emoji);

    // Call the original handler
    onEmojiSelected(emoji);

    if (showInModal && onClose) {
      onClose();
    }
  };

  const handleLongPress = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setTriggerPosition({
          x: pageX + width / 2,
          y: pageY
        });
        setShowRecentPopup(true);
      });
    }
  };

  const handleRecentEmojiSelect = async (emoji: string) => {
    // Add to recent emojis (moves to front)
    await addRecentEmoji(emoji);

    // Call the original handler
    onEmojiSelected(emoji);

    if (showInModal && onClose) {
      onClose();
    }
  };

  const renderContent = () => (
    <View className="flex-1">
      {/* Mode Toggle (only show if mode is 'both') */}
      {mode === 'both' && (
        <View className="flex-row bg-gray-100 rounded-xl p-1 mx-6 mb-4">
          <TouchableOpacity
            onPress={() => setCurrentMode('shorthand')}
            className={`flex-1 py-3 rounded-lg ${
              currentMode === 'shorthand'
                ? 'bg-white shadow-sm'
                : 'bg-transparent'
            }`}
          >
            <Text className={`text-center font-JakartaMedium ${
              currentMode === 'shorthand'
                ? 'text-gray-800'
                : 'text-gray-500'
            }`}>
              Quick
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentMode('library')}
            className={`flex-1 py-3 rounded-lg ${
              currentMode === 'library'
                ? 'bg-white shadow-sm'
                : 'bg-transparent'
            }`}
          >
            <Text className={`text-center font-JakartaMedium ${
              currentMode === 'library'
                ? 'text-gray-800'
                : 'text-gray-500'
            }`}>
              Library
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {currentMode === 'shorthand' ? (
        <View className="px-6">
          <EmojiShorthand
            onEmojiSelected={handleEmojiSelect}
            selectedEmoji={selectedEmoji}
            customShorthandEmojis={shorthandEmojis}
          />
        </View>
      ) : (
        <EmojiLibrary
          onEmojiSelected={handleEmojiSelect}
          selectedEmoji={selectedEmoji}
        />
      )}
    </View>
  );

  if (showInModal) {
    return (
      <ModalSheet
        isVisible={isVisible}
        title="Select Emoji"
        onClose={onClose || (() => {})}
      >
        {renderContent()}
      </ModalSheet>
    );
  }

  return renderContent();
};

export default EmojiSelector;
