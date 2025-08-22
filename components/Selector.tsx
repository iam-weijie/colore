// components/RadioButton.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Animated, Dimensions, Easing, FlatList, Image, View, Text, TouchableOpacity } from 'react-native';
import { RadioButtonProps } from '@/types/type';
import { images } from "@/constants/index";
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface EnhancedRadioButtonProps extends RadioButtonProps {
  variant?: 'default' | 'card' | 'pill';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  disabled?: boolean;
}

export const RadioButton: React.FC<EnhancedRadioButtonProps> = ({ 
  label, 
  selected, 
  onSelect, 
  variant = 'default',
  size = 'medium',
  color = '#007AFF',
  disabled = false
}) => {
  const scaleValue = new Animated.Value(selected ? 1 : 0);
  const opacityValue = new Animated.Value(selected ? 1 : 0);
  const borderColorValue = new Animated.Value(selected ? 1 : 0);
  const pressAnimation = new Animated.Value(1);
  
  // Dynamic sizing based on size prop
  const sizeConfig = {
    small: { circle: 16, padding: 8, fontSize: 12 },
    medium: { circle: 20, padding: 12, fontSize: 14 },
    large: { circle: 24, padding: 16, fontSize: 16 }
  };
  
  const config = sizeConfig[size];
  
  // Enhanced border color animation with custom color
  const borderColor = borderColorValue.interpolate({
    inputRange: [0, 1],
    outputRange: [disabled ? '#e5e5e5' : '#d1d5db', disabled ? '#e5e5e5' : color]
  });

  // Press animation
  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(pressAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 150,
        friction: 4
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(pressAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 4
      }).start();
    }
  };

  // Selection animations
  useEffect(() => {
    Animated.timing(borderColorValue, {
      toValue: selected ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: false
    }).start();

    if (selected) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 180,
          friction: 8,
          useNativeDriver: true
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [selected, color]);

  const renderDefault = () => (
    <Animated.View
      style={{
        transform: [{ scale: pressAnimation }]
      }}
    >
      <TouchableOpacity
        className="flex-row items-center justify-start"
        style={{ padding: config.padding }}
        activeOpacity={0.8}
        onPress={disabled ? undefined : onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View 
          className="flex-row items-center justify-center rounded-full border-2 shadow-sm"
          style={{ 
            width: config.circle,
            height: config.circle,
            borderColor,
            backgroundColor: selected ? `${color}10` : 'transparent'
          }}
        >
          {selected && (
            <Animated.View 
              className='rounded-full'
              style={{
                width: config.circle * 0.5,
                height: config.circle * 0.5,
                backgroundColor: color,
                opacity: opacityValue,
                transform: [{ scale: scaleValue }]
              }}
            />
          )}
        </Animated.View>
        
        <Text 
          className="ml-3 font-JakartaBold"
          style={{ 
            fontSize: config.fontSize,
            color: disabled ? '#9ca3af' : (selected ? '#1f2937' : '#6b7280')
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCard = () => (
    <Animated.View
      style={{
        transform: [{ scale: pressAnimation }]
      }}
    >
      <TouchableOpacity
        className="rounded-2xl border-2 shadow-sm mb-3"
        style={{
          borderColor: selected ? color : '#e5e7eb',
          backgroundColor: selected ? `${color}08` : '#ffffff',
          padding: config.padding + 4
        }}
        activeOpacity={0.9}
        onPress={disabled ? undefined : onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <View className="flex-row items-center justify-between">
          <Text 
            className="font-JakartaBold flex-1"
            style={{ 
              fontSize: config.fontSize,
              color: disabled ? '#9ca3af' : (selected ? color : '#374151')
            }}
          >
            {label}
          </Text>
          
          <Animated.View 
            className="rounded-full border-2"
            style={{ 
              width: config.circle,
              height: config.circle,
              borderColor: selected ? color : '#d1d5db',
              backgroundColor: selected ? color : 'transparent'
            }}
          >
            {selected && (
              <Animated.View 
                className="flex-1 items-center justify-center"
                style={{
                  opacity: opacityValue,
                  transform: [{ scale: scaleValue }]
                }}
              >
                <View 
                  className="rounded-full bg-white"
                  style={{
                    width: config.circle * 0.4,
                    height: config.circle * 0.4
                  }}
                />
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPill = () => (
    <Animated.View
      style={{
        transform: [{ scale: pressAnimation }]
      }}
    >
      <TouchableOpacity
        className="rounded-full mr-3 mb-3"
        style={{
          backgroundColor: selected ? color : '#f3f4f6',
          paddingVertical: config.padding,
          paddingHorizontal: config.padding + 8,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? color : '#e5e7eb'
        }}
        activeOpacity={0.8}
        onPress={disabled ? undefined : onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Text 
          className="font-JakartaBold text-center"
          style={{ 
            fontSize: config.fontSize,
            color: disabled ? '#9ca3af' : (selected ? '#ffffff' : '#6b7280')
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  switch (variant) {
    case 'card':
      return renderCard();
    case 'pill':
      return renderPill();
    default:
      return renderDefault();
  }
};

interface EnhancedUniqueSelectionProps {
  options: { label: string; description?: string; icon?: any }[];
  selected: string;
  description?: string;
  onSelect: (option: string) => void;
  variant?: 'default' | 'card' | 'pill';
  color?: string;
  multiColumn?: boolean;
}

export const UniqueSelection: React.FC<EnhancedUniqueSelectionProps> = ({ 
  options, 
  selected, 
  description, 
  onSelect,
  variant = 'default',
  color = '#007AFF',
  multiColumn = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(selected);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, []);

  const handleSelect = (option: string) => {
    if (selectedOption !== option) {
      setSelectedOption(option);
      onSelect(option);
    }
  };

  useEffect(() => {
    if (options.length > 0 && !selectedOption) {
      handleSelect(options[0].label);
    }
  }, [options]);

  const renderOptions = () => {
    if (variant === 'pill' && multiColumn) {
      return (
        <View className="flex-row flex-wrap justify-start">
          {options.map((option, index) => (
            <RadioButton
              key={`${option.label}-${index}`}
              label={option.label}
              selected={selectedOption === option.label}
              onSelect={() => handleSelect(option.label)}
              variant={variant}
              color={color}
            />
          ))}
        </View>
      );
    }

    return options.map((option, index) => (
      <Animated.View
        key={`${option.label}-${index}`}
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }}
      >
        <RadioButton
          label={option.label}
          selected={selectedOption === option.label}
          onSelect={() => handleSelect(option.label)}
          variant={variant}
          color={color}
        />
        {option.description && selectedOption === option.label && (
          <Animated.View
            entering={() => ({
              opacity: { from: 0, to: 1, duration: 200 },
              transform: [{ translateY: { from: -10, to: 0, duration: 200 } }]
            })}
          >
            <Text className="text-xs text-gray-500 ml-8 mb-2 italic">
              {option.description}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    ));
  };

  return (
    <Animated.View 
      className="flex-1 w-full mb-4"
      style={{ opacity: fadeAnim }}
    >
      {description && (
        <View className="bg-blue-50 rounded-xl p-4 mx-4 mb-6">
          <Text className="text-center text-gray-600 text-sm font-Jakarta leading-5">
            {description}
          </Text>
        </View>
      )}
      
      <View className="mx-4">
        {renderOptions()}
      </View>
    </Animated.View>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = screenWidth * 0.25;

interface EnhancedNumberSelectionProps {
  maxNum: number;
  minNum: number;
  onSelect: (number: number) => void;
  selectedColor?: string;
  title?: string;
  subtitle?: string;
}

export const NumberSelection: React.FC<EnhancedNumberSelectionProps> = ({ 
  maxNum, 
  minNum, 
  onSelect,
  selectedColor = '#007AFF',
  title = 'Select Number',
  subtitle
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const hapticTimer = useRef<NodeJS.Timeout>();
  
  const numberList = Array.from({ length: maxNum - minNum + 1 }, (_, index) => minNum + index);
  const contentInset = (screenWidth - ITEM_WIDTH) / 2;

  // Enhanced color palette
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: 0,
          animated: true,
        });
      }, 100);
    }
    onSelect?.(numberList[0]);
  }, []);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: () => setIsScrolling(true)
    }
  );

  const onScrollEnd = () => {
    setIsScrolling(false);
  };

  useEffect(() => {
    const listener = scrollX.addListener(({ value }) => {
      const scrollPosition = value + contentInset;
      const index = Math.round(scrollPosition / ITEM_WIDTH);
      
      if (index >= 0 && index < numberList.length && index !== selectedIndex) {
        setSelectedIndex(index);
        onSelect(numberList[index]);
        
        // Haptic feedback with debouncing
        if (hapticTimer.current) {
          clearTimeout(hapticTimer.current);
        }
        hapticTimer.current = setTimeout(() => {
          // Add haptic feedback here if you have expo-haptics
          // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 50);
      }
    });
    
    return () => {
      scrollX.removeListener(listener);
      if (hapticTimer.current) {
        clearTimeout(hapticTimer.current);
      }
    };
  }, [selectedIndex, numberList]);

  const getScale = (index: number) => {
    const inputRange = [
      (index - 2) * ITEM_WIDTH,
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
      (index + 2) * ITEM_WIDTH
    ];
    return scrollX.interpolate({
      inputRange: inputRange.map(x => x - contentInset),
      outputRange: [0.6, 0.8, 1.3, 0.8, 0.6],
      extrapolate: 'clamp',
    });
  };

  const getOpacity = (index: number) => {
    const inputRange = [
      (index - 2) * ITEM_WIDTH,
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
      (index + 2) * ITEM_WIDTH
    ];
    return scrollX.interpolate({
      inputRange: inputRange.map(x => x - contentInset),
      outputRange: [0.3, 0.6, 1, 0.6, 0.3],
      extrapolate: 'clamp',
    });
  };

  const getBackgroundScale = (index: number) => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH
    ];
    return scrollX.interpolate({
      inputRange: inputRange.map(x => x - contentInset),
      outputRange: [0.8, 1.2, 0.8],
      extrapolate: 'clamp',
    });
  };

  return (
    <View className="flex-1 min-h-[250px]">
      {/* Header Section */}
      <View className="items-center mb-8 px-4">
        <Text className="text-2xl font-JakartaBold text-gray-800 mb-2">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-500 text-center font-Jakarta">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Selection Area with Visual Indicator */}
      <View className="relative flex-1 items-center justify-center">
        {/* Background selection indicator */}
        <View 
          className="absolute z-0 rounded-3xl border-4"
          style={{
            width: ITEM_WIDTH * 0.9,
            height: ITEM_WIDTH * 0.9,
            borderColor: selectedColor + '30',
            backgroundColor: selectedColor + '10'
          }}
        />
        
        {/* Gradient overlays for fade effect */}
        <View className="absolute left-0 top-0 bottom-0 w-20 z-10">
          <View 
            className="flex-1"
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))`
            }}
          />
        </View>
        <View className="absolute right-0 top-0 bottom-0 w-20 z-10">
          <View 
            className="flex-1"
            style={{
              background: `linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))`
            }}
          />
        </View>

        <FlatList
          ref={flatListRef}
          data={numberList}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          snapToAlignment="center"
          decelerationRate="fast"
          contentInset={{ left: contentInset, right: contentInset }}
          contentOffset={{ x: -contentInset, y: 0 }}
          onScroll={onScroll}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => {
            const isSelected = selectedIndex === index;
            const itemColor = colorPalette[index % colorPalette.length];
            
            return (
              <View 
                style={{ width: ITEM_WIDTH }} 
                className="flex-row justify-center items-center"
              >
                {/* Animated background circle */}
                <Animated.View
                  className="absolute rounded-full items-center justify-center"
                  style={{
                    width: ITEM_WIDTH * 0.75,
                    height: ITEM_WIDTH * 0.75,
                    backgroundColor: isSelected ? selectedColor : itemColor,
                    opacity: isSelected ? 0.9 : (isScrolling ? 0.4 : 0.2),
                    transform: [
                      { scale: isSelected ? getBackgroundScale(index) : 0.8 }
                    ]
                  }}
                >
                  {/* Inner highlight */}
                  {isSelected && (
                    <View 
                      className="absolute rounded-full"
                      style={{
                        width: '60%',
                        height: '60%',
                        backgroundColor: 'rgba(255,255,255,0.3)'
                      }}
                    />
                  )}
                </Animated.View>
                
                {/* Number text */}
                <Animated.Text
                  className="font-JakartaBold text-center z-10"
                  style={{
                    fontSize: isSelected ? 42 : 36,
                    color: isSelected ? '#ffffff' : '#374151',
                    fontWeight: isSelected ? '800' : '700',
                    textShadowColor: isSelected ? 'rgba(0,0,0,0.3)' : 'transparent',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3,
                    transform: [{ scale: getScale(index) }],
                    opacity: getOpacity(index),
                  }}
                >
                  {item}
                </Animated.Text>
                
                {/* Selection indicator dot */}
                {isSelected && (
                  <Animated.View
                    className="absolute -bottom-8 w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: selectedColor,
                      transform: [{
                        scale: scrollX.interpolate({
                          inputRange: [
                            (index - 0.5) * ITEM_WIDTH - contentInset,
                            index * ITEM_WIDTH - contentInset,
                            (index + 0.5) * ITEM_WIDTH - contentInset
                          ],
                          outputRange: [0, 1, 0],
                          extrapolate: 'clamp'
                        })
                      }]
                    }}
                  />
                )}
              </View>
            );
          }}
          keyExtractor={(item, index) => `${item}-${index}`}
          getItemLayout={(data, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
        />
      </View>

      {/* Selected Value Display */}
      <View className="items-center mt-8 mb-4">
        <View 
          className="px-6 py-3 rounded-full"
          style={{ backgroundColor: selectedColor + '20' }}
        >
          <Text 
            className="font-JakartaBold text-lg"
            style={{ color: selectedColor }}
          >
            Selected: {numberList[selectedIndex]}
          </Text>
        </View>
      </View>
    </View>
  );
};