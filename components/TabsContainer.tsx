import React, { useEffect } from "react";
import { View, Dimensions } from "react-native";
import TabNavigation from "./TabNavigation";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from "react-native-reanimated";
import { TabItem, TabsContainerProps } from "./types";

const TabsContainer: React.FC<TabsContainerProps> = ({
  tabs,
  selectedTab,
  onTabChange,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / tabs.length;
  const translateX = useSharedValue(0);

  // Find the active index based on selectedTab
  const activeIndex = tabs.findIndex(tab => tab.key === selectedTab);
  
  // Update the animation position when selectedTab changes
  useEffect(() => {
    if (activeIndex >= 0) {
      translateX.value = withTiming(activeIndex * tabWidth, { duration: 300 });
    }
  }, [selectedTab, activeIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth,
    };
  });

  const handleTabPress = (index: number, key: string) => {
    translateX.value = withSpring(index * tabWidth, {
      damping: 15,
      stiffness: 120,
    });
    onTabChange(key);
  };

  return (
    <View className="w-full bg-white">
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
      
      {/* Animated border */}
      <Animated.View
        style={[
          {
            height: 2,
            backgroundColor: "#000",
          },
          animatedStyle
        ]}
      />
    </View>
  );
};

export default TabsContainer;