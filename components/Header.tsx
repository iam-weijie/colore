import { 
  Text, 
  View,
  TouchableOpacity
} from "react-native";
import React from "react";
import { TabItem } from "@/types/type";
import TabsContainer from "./TabsContainer";
import { AntDesign } from '@expo/vector-icons';
import { router } from "expo-router";


type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

const Header = ({
    title,
    item, 
    tabs, 
    selectedTab, 
    onTabChange, 
    tabCount,
    showBackButton,
    onBackPress
  }: {
    title?: string, 
    item?: React.ReactNode,
    tabs?: TabItem[], 
    selectedTab?: string, 
    onTabChange?: (tabKey: string) => void, 
    tabCount?: number,
    showBackButton?: boolean,
    onBackPress?: () => void
  }) => {

    const handleTabChange = (tabKey: string) => {
        if (tabs && onTabChange) {
            onTabChange(tabKey);
        }
    };

    const handleBackPress = () => {
      if (onBackPress) {
        onBackPress();
      } else {
        router.back();
      }
    };

  return (
     <View 
     className="flex-column justify-end items-start pt-12  bg-white z-10 rounded-b-[44px] overflow-hidden "
     style={{
        boxShadow: '0 8px 24px rgba(180, 180, 180, 0.1)', // Custom shadow
      }}
    >
      <View className="relative w-full">
        {showBackButton && (
          <TouchableOpacity 
            onPress={handleBackPress} 
            className="absolute left-3 top-4 p-2 z-10"
          >
            <AntDesign name="arrowleft" size={20} color="black" />
          </TouchableOpacity>
        )}
        {title && (
          <View className="pl-8 w-full mt-2 max-w-[80%]">
            <Text 
              className="text-[22px] font-JakartaBold"
              style={{
                marginBottom: tabs ? 0 : (item ? 8 : 24)
              }}
            >
              {title}
            </Text>
          </View>
        )}
      </View>
      {item && item}            
      {tabs && 
        <TabsContainer
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          tabCount={tabCount}
        />
      }
    </View>
  );
};

export default Header;
