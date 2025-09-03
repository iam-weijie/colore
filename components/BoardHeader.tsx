import React from "react";
import {
  View,
  Text,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Board } from "@/types/type";
import { useBackgroundColor, useTextColor } from "@/hooks/useTheme";

interface BoardHeaderProps {
  username: string | string[];
  boardInfo: Board | undefined;
  postCount: number;
  isOwnBoard: boolean;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  username,
  boardInfo,
  postCount,
  isOwnBoard,
}) => {
  const textColor = useTextColor()
  const handleLongUsername = (username: string): string => {
    // Trim and normalize spacing
    let cleanUsername = username.trim().replace(/\s+/g, " ");

    // If the username has spaces and is too long
    if (cleanUsername.includes(" ") && cleanUsername.length > 14) {
      // Replace "and" and "to" with "&" and "2" respectively (only whole words)
      cleanUsername = cleanUsername
        .split(" ")
        .map(word => {
          if (/^and$/i.test(word)) return "&";
          if (/^to$/i.test(word)) return "2";
          return word;
        })
        .join(" ");

      // Take first character of each word, preserve special symbols like & or 2
      return cleanUsername
        .split(" ")
        .filter(Boolean)
        .map(word => (word.length === 1 ? word : word[0].toUpperCase()))
        .join("");
    }

    // If it's a long single word, extract all capital letters
    if (!cleanUsername.includes(" ") && cleanUsername.length > 14) {
      const caps = cleanUsername.match(/[A-Z]/g);
      return caps ? caps.join("") : cleanUsername.slice(0, 8);
    }

    // Otherwise return as-is
    return cleanUsername;
  };

  return (
    <View className="mx-6 mt-2 mb-6 flex-row justify-between items-center w-full px-4">
      <Animated.View entering={FadeIn.duration(800)}>
        {username ? (
          <View className="max-w-[200px]">
            <Text 
            className={`text-xl font-JakartaBold`}
            style={{
              color: textColor
            }}>
              {handleLongUsername(username as string)}
            </Text>
          </View>
        ) : (
          <Text
            className={`text-xl font-JakartaBold`}
            style={{
                color: textColor
              }}
            
          >
            Personal Board
          </Text>
        )}
        {boardInfo ? (
          <View className="max-w-[200px]">
            <Text 
            className=" text-[14px] text-left font-Jakarta"
            style={{
              color: textColor
            }}>
              {boardInfo.description.trim()}
            </Text>
          </View>
        ) : (
          <View>
            <Text 
            className=" text-[14px] text-left font-Jakarta"
            style={{
              color: textColor
            }}
            >
              {isOwnBoard ? "Your" : username + "'s"} personal space.
            </Text>
          </View>
        )}
      </Animated.View>
      {boardInfo && (
        <View className="flex-row gap-6 mr-7">
          <View>
            <Text 
            className="text-lg font-JakartaSemiBold"
            style={{
              color: textColor
            }}>
              {postCount}
            </Text>
            <Text 
            className="text-xs font-JakartaSemiBold"
            style={{
              color: textColor
            }}>Posts</Text>
          </View>
          <View className="flex-column items-start justify-center">
            <Text 
            className="text-lg font-JakartaSemiBold"
            style={{
              color: textColor
            }}>
              {boardInfo?.members_id.length}
            </Text>
            <Text 
            className="text-xs font-JakartaSemiBold"
            style={{
              color: textColor
            }}>
              Members
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default BoardHeader;
