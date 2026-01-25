import React, { useEffect } from "react";
import { View, Dimensions } from "react-native";
import TabNavigation from "./TabNavigation";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolateColor
} from "react-native-reanimated";
import { TabItem, TabsContainerProps } from "@/types/type";

const TabsContainer: React.FC<TabsContainerProps> = ({
  tabs,
  selectedTab,
  onTabChange,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / tabs.length;
  const translateX = useSharedValue(0);
  const progress = useSharedValue(0);

  const activeIndex = tabs.findIndex(tab => tab.key === selectedTab);

  useEffect(() => {
    if (activeIndex >= 0) {
      progress.value = withTiming(0, { duration: 150 }, () => {
        translateX.value = withTiming(activeIndex * tabWidth, { 
          duration: 300,
          easing: (t) => Math.pow(t, 0.7)
        });
        progress.value = withTiming(1, { duration: 150 });
      });
    }
  }, [selectedTab, activeIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ 
        translateX: translateX.value - 4,
      }],
      width: tabWidth - 24, // Adjusted for padding
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['#ffffff60', '#ffffff90'] // Semi-transparent white
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        ['#ffffff60', '#ffffff80']
      ),
    };
  });

  const handleTabPress = (index: number, key: string) => {
    progress.value = withTiming(0, { duration: 100 }, () => {
      translateX.value = withSpring(index * tabWidth, {
        damping: 15,
        stiffness: 120,
        overshootClamping: true,
      });
      progress.value = withTiming(1, { duration: 100 });
    });
    onTabChange(key);
  };

  if (!tabs) {
    return null;
  }

  return (
    <View 
      className="w-full m-2 mx-auto"
      style={{
        borderRadius: 32,
        backgroundColor: '#ffffff30', // Semi-transparent background
        borderColor: '#ffffff80',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      }}
    >
      <View className="relative overflow-hidden">
        {/* Frosted glass style indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 16,
              height: 48,
              borderRadius: 24,
              borderWidth: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 2,
              backdropFilter: 'blur(10px)', // For web, will need alternative for mobile
            },
            animatedStyle,
            backgroundAnimatedStyle
          ]}
        />

        {/* Tabs with better spacing */}
        <View className="flex-row">
          {tabs.map((tab, index) => (
            <TabNavigation
              key={tab.key}
              name={tab.name}
              focused={selectedTab === tab.key}
              onPress={() => handleTabPress(index, tab.key)}
              notifications={tab.notifications || 0}
              color={tab.color}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default TabsContainer;