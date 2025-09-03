import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DropdownMenu from "../DropdownMenu";
import { RichText } from "../RichTextInput";
import { LocalMenuItem, LocalPostCardProps } from "@/types/type";
import { icons } from "@/constants";
import { useBackgroundColor, useIsDark, useTextColor } from "@/hooks/useTheme";

const PostCard: React.FC<LocalPostCardProps> = ({
  isIpad,
  isPreview,
  isShowCasing,
  allowedComments,
  currentPost,
  userId,
  formatting,
  likeCount,
  isLiked,
  onClose,
  onComments,
  onLike,
  menuItems,
  reanimatedCardStyle,
}) => {

  const textColor = useTextColor()
  const backgroundColor = useBackgroundColor()
  const readyToDisplay = useRef(false);

  useEffect(() => {
    if (currentPost) {
      readyToDisplay.current = true;
    }
  }, [currentPost, isLiked]);

  return (
    <Animated.View
      entering={FadeInUp.delay(300).duration(400)}
      exiting={FadeOutDown.duration(250)}
      className="px-6 py-4 rounded-[24px] w-[80%] max-w-[500px] mx-auto"
      style={[
        reanimatedCardStyle,
        {
          minHeight: isIpad ? 250 : 200,
          maxHeight: isIpad ? "55%" : "40%",
          backgroundColor: backgroundColor,
        },
      ]}
    >
      <TouchableOpacity onPress={onClose}>
        <Image source={icons.close} tintColor={textColor} style={{ width: 18, height: 18, top: 4, alignSelf: "flex-end", opacity: 0.5 }} />
      </TouchableOpacity>

      <ScrollView>
        { (!readyToDisplay.current) ? (
          <View className="flex-1 justify-center items-center" />
        ) : (currentPost?.content?.length || 0) > 0 ? (
          <RichText formatStyling={formatting} content={currentPost?.content || ""} />
        ) : (
          <Text 
          className="py-2 text-center"
          style={{
            color: textColor
          }}
          >No content to display</Text>
        )}
      </ScrollView>

      {!isPreview && !isShowCasing && (
        <View className="my-2 flex-row justify-between items-center">
          <View className="flex flex-row items-center">
            {allowedComments && (
              <TouchableOpacity onPress={onComments}>
                <Image source={icons.comment} tintColor={textColor}  className="w-7 h-7" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onLike} className="ml-2">
              <MaterialCommunityIcons
                name={isLiked ? "heart" : "heart-outline"}
                size={31}
                color={isLiked ? "red" : textColor}
              />
            </TouchableOpacity>

            {currentPost?.user_id === userId && <Text className="ml-1" style={{ color: textColor }}>{likeCount}</Text>}
          </View>

          <DropdownMenu menuItems={menuItems as LocalMenuItem[]} />
        </View>
      )}
    </Animated.View>
  );
};

export default PostCard;
