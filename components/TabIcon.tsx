import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import React, { useEffect } from "react";
import { Animated, View, Text } from "react-native";
import { useBackgroundColor, useTextColor } from "@/hooks/useTheme";
interface TabIconProps {
  source: any;
  focused: boolean;
  unread: number;
  color: string;
  label?: string;
  isCenter?: boolean;
  nativeIcon: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ 
  source, 
  focused, 
  unread, 
  color, 
  label, 
  isCenter = false, 
  nativeIcon = true
}) => {

  const textColor = useTextColor();
  const backgroundColor = useBackgroundColor();

  return (
    <View className="flex-1 flex flex-col items-center justify-center">
      <View
        className={`flex items-center justify-center ${
          isCenter ? "w-16 h-16" : "w-11 h-11"
        } rounded-full`}
        style={{
          backgroundColor: isCenter ? "#ffffff" : "transparent",
          marginTop: isCenter ? -20 : 0,
          shadowColor: isCenter && focused ? "#505050" : undefined,
          shadowOpacity: isCenter && focused ? 0.15 : undefined,
          shadowRadius: isCenter && focused ? 6 : undefined,
          shadowOffset: isCenter && focused ? { width: 0, height: 3 } : undefined,
        }}
      >
        <Animated.Image
          source={source}
          className={`${nativeIcon ? "w-10 h-10" : isCenter ? "w-[20] h-[20]" : "w-[18] h-[18]"}`}
          style={{
            opacity: !nativeIcon ? isCenter ? 1 : focused ? 1 : 0.75 : 1,
          }}
          resizeMode="cover"
          tintColor={nativeIcon ? "" : isCenter ? "#000" : textColor}
        />
          {focused && !isCenter && (
          <View 
          className={` w-1 h-1 rounded-full`}
          style={{backgroundColor: color ? color : textColor}} />
        )}
      </View>
      {/* Hide label if center */}
      {!isCenter && (
        <View>
          <Text
            className="w-full text-center text-xs font-JakartaSemiBold"
            style={{
              opacity: !nativeIcon ? isCenter ? 1 : focused ? 1 : 0.75 : 1,
              marginTop: -2,
              color: textColor
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </View>
  );
};

export default TabIcon;