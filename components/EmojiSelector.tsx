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

  const renderContent = () => (
    <View className="flex-1">

        <EmojiLibrary
          onEmojiSelected={handleEmojiSelect}
          selectedEmoji={selectedEmoji}
        />

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
