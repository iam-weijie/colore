import React, { useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Dimensions } from 'react-native';

interface AlphabetScrollbarProps {
  letters: string[];
  currentLetter: string;
  onLetterPress: (letter: string, index: number) => void;
  containerHeight?: number;
}

const { height: screenHeight } = Dimensions.get('window');

const AlphabetScrollbar: React.FC<AlphabetScrollbarProps> = ({ 
  letters, 
  currentLetter, 
  onLetterPress,
  containerHeight = screenHeight * 0.7
}) => {
  // Memoize to avoid recalculation
  const letterHeight = useMemo(() => 
    containerHeight / Math.max(letters.length, 1), 
    [containerHeight, letters.length]
  );
  
  // Use a ref to track the last pressed letter to avoid unnecessary scrolling
  const lastPressedLetter = useRef<string | null>(null);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        handleTouch(gestureState.y0);
      },
      onPanResponderMove: (evt, gestureState) => {
        handleTouch(gestureState.moveY);
      },
    })
  ).current;

  const handleTouch = (y: number) => {
    // Calculate relative position based on the top of our component (not the screen)
    // This is an estimation - we'd need the actual component position for perfect accuracy
    const relativePosition = y - (screenHeight * 0.15);
    if (relativePosition < 0) return;
    
    const letterIndex = Math.min(
      Math.floor(relativePosition / letterHeight),
      letters.length - 1
    );
    
    if (letterIndex >= 0 && letterIndex < letters.length) {
      const letter = letters[letterIndex];
      
      // Only trigger the callback if this is a different letter than last time
      if (lastPressedLetter.current !== letter) {
        lastPressedLetter.current = letter;
        onLetterPress(letter, letterIndex);
      }
    }
  };

  if (letters.length === 0) return null;

  return (
    <View
      className="absolute right-2 top-2 w-10 bg-white/90 rounded-xl items-center justify-evenly z-10 shadow-md"
      style={{ height: containerHeight }}
      {...panResponder.panHandlers}
    >
      {letters.map((letter, index) => (
        <TouchableOpacity
          key={letter}
          className={`w-full items-center justify-center ${currentLetter === letter ? 'bg-gray-200/90 font-bold' : ''}`}
          style={{ height: letterHeight }}
          onPress={() => {
            lastPressedLetter.current = letter;
            onLetterPress(letter, index);
          }}
        >
          <Text 
            className={`text-base ${currentLetter === letter ? 'font-bold text-blue-600' : 'font-medium text-gray-600'}`}
          >
            {letter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default React.memo(AlphabetScrollbar); 