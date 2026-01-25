import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import EmojiSelector from './EmojiSelector';
import EmojiShorthand from './EmojiShorthand';
import EmojiLibrary from './EmojiLibrary';

const EmojiDemo: React.FC = () => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentDemo, setCurrentDemo] = useState<'shorthand' | 'library' | 'both'>('shorthand');

  return (
    <View className="flex-1 p-6 bg-gray-50">
      <Text className="text-2xl font-JakartaBold text-center mb-6">
        Emoji Selector Demo
      </Text>

      {/* Selected Emoji Display */}
      <View className="bg-white rounded-xl p-6 mb-6 items-center">
        <Text className="text-lg font-JakartaMedium mb-2">Selected Emoji:</Text>
        {selectedEmoji ? (
          <Text style={{ fontSize: 48 }}>{selectedEmoji}</Text>
        ) : (
          <Text className="text-gray-400 text-lg">None selected</Text>
        )}
      </View>

      {/* Demo Mode Selector */}
      <View className="flex-row bg-white rounded-xl p-2 mb-6">
        {(['shorthand', 'library', 'both'] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => setCurrentDemo(mode)}
            className={`flex-1 py-3 rounded-lg ${
              currentDemo === mode ? 'bg-blue-500' : 'bg-transparent'
            }`}
          >
            <Text className={`text-center font-JakartaMedium capitalize ${
              currentDemo === mode ? 'text-white' : 'text-gray-700'
            }`}>
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Demo Components */}
      {currentDemo === 'shorthand' && (
        <EmojiShorthand
          onEmojiSelected={setSelectedEmoji}
          selectedEmoji={selectedEmoji}
        />
      )}

      {currentDemo === 'library' && (
        <EmojiLibrary
          onEmojiSelected={setSelectedEmoji}
          selectedEmoji={selectedEmoji}
        />
      )}

      {currentDemo === 'both' && (
        <>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="bg-blue-500 py-4 rounded-xl mb-4"
          >
            <Text className="text-white text-center font-JakartaMedium">
              Open Modal Selector
            </Text>
          </TouchableOpacity>

          <EmojiSelector
            showInModal={true}
            isVisible={showModal}
            onClose={() => setShowModal(false)}
            onEmojiSelected={setSelectedEmoji}
            selectedEmoji={selectedEmoji}
            mode="both"
          />
        </>
      )}
    </View>
  );
};

export default EmojiDemo;
