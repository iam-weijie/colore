import React from 'react';
import { View, TouchableOpacity, Dimensions, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import TabIcon from './TabIcon'; // Adjust your import

const { width } = Dimensions.get('window');
const height = 90; // Change this if you want

// --- 1. Regular Custom Tab Bar (linked to Tabs state)
export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const centerIndex = Math.floor(state.routes.length / 2);

  return (
    <View 
    style={{ 
      position: 'absolute', 
      bottom: 0, 
      width, 
      height, 
      alignItems: 'center',
      shadowColor: '#B4B4B4',
      shadowOffset: { width: 0, height: -2 }, // Negative height for bottom shadow
      shadowOpacity: 0.1,
      shadowRadius: 8,
      // Elevation for Android
      elevation: 10, }}>
      <NavbarBackground />
      
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          width,
          height,
          paddingHorizontal: 20,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = index === centerIndex;

          const translateY = useSharedValue(0);
          React.useEffect(() => {
            if (isFocused && isCenter) {
              translateY.value = withTiming(-10, { duration: 300 });
            } else if (isCenter) {
              translateY.value = withTiming(0, { duration: 300 });
            }
          }, [isFocused]);

          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ translateY: translateY.value }],
          }));

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              activeOpacity={0.9}
              onPress={onPress}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                top: isCenter ? -30 : 0,
              }}
            >
              {isCenter ? (
                <Animated.View style={animatedStyle}>
                  <TabIcon
                    source={options.tabBarIcon?.({ focused: isFocused, color: '', size: 24 })?.props?.source}
                    focused={isFocused}
                    unread={0}
                    color=""
                    label={options.tabBarLabel as string}
                    isCenter
                    nativeIcon={true}
                  />
                </Animated.View>
              ) : (
                <TabIcon
                  source={options.tabBarIcon?.({ focused: isFocused, color: '', size: 24 })?.props?.source}
                  focused={isFocused}
                  unread={0}
                  color=""
                  label={options.tabBarLabel as string}
                  isCenter={false}
                  nativeIcon={true}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface CustomButton {
  icon: any;
  label?: string;
  onPress: () => void;
  isCenter?: boolean;
}

export const CustomButtonBar: React.FC<{ buttons: CustomButton[] }> = ({ buttons }) => {
  const centerIndex = Math.floor(buttons.length / 2);

  const leftButtons = buttons.slice(0, centerIndex);
  const centerButton = buttons[centerIndex];
  const rightButtons = buttons.slice(centerIndex + 1);

  return (
    <View 
    style={{ 
      position: 'absolute', 
      bottom: 0, 
      width, 
      height, 
      alignItems: 'center',
      shadowColor: '#B4B4B4',
      shadowOffset: { width: 0, height: -2 }, // Negative height for bottom shadow
      shadowOpacity: 0.1,
      shadowRadius: 8,
      // Elevation for Android
      elevation: 10, }}>
      <NavbarBackground />

      {/* Button Row */}
      <View style={{
  flexDirection: 'row',
  alignItems: 'center',
  width,
  height,
  top: -5,
}}>
  {/* LEFT SIDE */}
  <View
    style={{
      width: width * 0.375, // 37.5% of screen for left
      alignItems: 'center', // Center inside this block
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
      paddingLeft: 10
    }}
  >
    {leftButtons.map((button, index) => (
      <TouchableOpacity
        key={`left-${index}`}
        onPress={button.onPress}
        activeOpacity={0.9}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TabIcon
          source={button.icon}
          focused={false}
          unread={0}
          color=""
          label={button.label}
          isCenter={false}
          nativeIcon={false}
        />
      </TouchableOpacity>
    ))}
  </View>

  {/* Spacer for notch */}
  <View style={{ width: width * 0.25 }} />

  {/* RIGHT SIDE */}
  <View
    style={{
      width: width * 0.375, // 37.5% of screen for right
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
      paddingRight: 10
    }}
  >
    {rightButtons.map((button, index) => (
      <TouchableOpacity
        key={`right-${index}`}
        onPress={button.onPress}
        activeOpacity={0.9}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TabIcon
          source={button.icon}
          focused={false}
          unread={0}
          color=""
          label={button.label}
          isCenter={false}
          nativeIcon={false}
        />
      </TouchableOpacity>
    ))}
  </View>
</View>


      {/* CENTER BUTTON (absolutely positioned) */}
      <TouchableOpacity
        onPress={centerButton.onPress}
        activeOpacity={0.9}
        style={{
          position: 'absolute',
          left: width / 2 - 32, // 64px button width
          top: -15,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View>
          <TabIcon
            source={centerButton.icon}
            focused={false}
            unread={0}
            color=""
            label={centerButton.label}
            isCenter
            nativeIcon={false}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};


// --- 3. Navbar Background shared
const NavbarBackground = () => (
  <Svg width={width} height={height} style={{ position: 'absolute' }}>
<Path
  d={`
    M30 0
    H${width * 0.34}
    C${width * 0.39} 0, ${width * 0.40} ${height * 0.22}, ${width * 0.465} ${height * 0.38}
    Q${width * 0.5} ${height * 0.45}, ${width * 0.535} ${height * 0.38}
    C${width * 0.60} ${height * 0.22}, ${width * 0.61} 0, ${width * 0.66} 0
    H${width - 30}
    A30 30 0 0 1 ${width} 30
    V${height}
    H0
    V30
    A30 30 0 0 1 30 0
    Z
  `}
  fill="white"
/>
  </Svg>
);
