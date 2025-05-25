import { 
  Text, 
  View,
} from "react-native";
import React from "react";
import { TabItem } from "@/types/type";
import TabsContainer from "./TabsContainer";



type HeaderProps = {
  title: string;
};

const Header = ({
    title,
    item, 
    tabs, 
    selectedTab, 
    onTabChange, 
    tabCount }: {
    title?: string, 
    item?: React.ReactNode,
    tabs?: TabItem[], 
    selectedTab?: string, 
    onTabChange?: (tabKey: string) => void, 
    tabCount?: number}) => {

    const handleTabChange = (tabKey: string) => {
        if (tabs) {
            onTabChange(tabKey);
        }
        };

  return (
     <View 
     className="flex-column justify-end items-start pt-16  bg-white z-10 rounded-b-[44px] overflow-hidden "
     style={{
        boxShadow: '0 8px 24px rgba(180, 180, 180, 0.1)', // Custom shadow
      }}
>
        {title && <View className="pl-12 ">
                    <Text 
                    className="text-2xl font-JakartaBold mt-4"
                    style={{
                        marginBottom: tabs ? 0 : (item ? 8 : 24)
                    }}>{title}</Text>
                    </View>}
        {item && item}            
        {tabs && 
        <TabsContainer
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          tabCount={tabCount}
        />}
         </View>

  );
};

export default Header;
