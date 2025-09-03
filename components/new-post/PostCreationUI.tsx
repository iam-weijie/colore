import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { PostItColor } from "@/types/type";
import { icons } from "@/constants";
import Header from "@/components/Header";
import ColorPickerSlider from "@/components/ColorPickerSlider";
import RichTextInput from "@/components/RichTextInput";
import InteractionButton from "@/components/InteractionButton";
import EmojiShorthand from "@/components/EmojiShorthand";
import PostContainer from "@/components/post-container/PostContainer";
import { CustomButtonBar } from "@/components/CustomTabBar";
import EmojiSelector from "@/components/EmojiSelector";
import RecentEmojiPopup from "@/components/RecentEmojiPopup";
import { getPostTitle } from "./utils";
import { useAllPostItColors } from "@/hooks/useTheme";

interface PostCreationUIProps {
  // State
  selectedColor: PostItColor;
  selectedEmoji: string | null;
  isQuickEmojiSelectorVisible: boolean;
  isEmojiSelectorVisible: boolean;
  showRecentPopup: boolean;
  triggerPosition: { x: number; y: number };
  activeEmojiIndex: number;
  selectedTab: string;
  isFocused: boolean;
  withdrawKeyboard: boolean;
  refreshingKey: number;
  draftPost: any;
  userColors: PostItColor[];
  shorthandEmojis: string[];
  recentEmojis: string[];
  selectedStaticEmoji: boolean;
  
  // Handlers
  handleColorSelect: (color: PostItColor) => void;
  handleChangeText: (text: string) => void;
  handleChangeFormat: (formats: any[]) => void;
  handleChangeFocus: (state: boolean) => void;
  handleEmojiSelect: (emoji: string) => void;
  toggleEmojiSelector: () => void;
  setQuickEmojiSelectorVisible: (visible: boolean) => void;
  setSelectedStaticEmoji: (staticEmoji: boolean) => void;
  setRefreshingKey: (key: number) => void;
  
  // Navigation
  navigationControls: any[];
  
  // Params
  postId?: string;
  prompt?: string;
  recipientId?: string;
  username?: string;
}

export const PostCreationUI: React.FC<PostCreationUIProps> = ({
  selectedColor,
  selectedEmoji,
  isQuickEmojiSelectorVisible,
  isEmojiSelectorVisible,
  showRecentPopup,
  triggerPosition,
  activeEmojiIndex,
  selectedTab,
  isFocused,
  withdrawKeyboard,
  refreshingKey,
  draftPost,
  userColors,
  shorthandEmojis,
  recentEmojis,
  selectedStaticEmoji,
  handleColorSelect,
  handleChangeText,
  handleChangeFormat,
  handleChangeFocus,
  handleEmojiSelect,
  toggleEmojiSelector,
  setQuickEmojiSelectorVisible,
  setSelectedStaticEmoji,
  setRefreshingKey,
  navigationControls,
  postId,
  prompt,
  recipientId,
  username,
}) => {

  const allColors = useAllPostItColors();
  const trueColor = allColors.find((color) => color.id === selectedColor.id);
  const backgroundColor = useSharedValue(
    trueColor?.hex || "rgba(0, 0, 0, 0.5)"
  );
  const prevColor = React.useRef(backgroundColor.value);

  React.useEffect(() => {
    if (prevColor.current !== (trueColor?.hex || "rgba(0, 0, 0, 0.5)")) {
      backgroundColor.value = withTiming(
        trueColor?.hex || "rgba(0, 0, 0, 0.5)",
        {
          duration: 300,
          easing: Easing.inOut(Easing.quad),
        }
      );
      prevColor.current = trueColor?.hex || "rgba(0, 0, 0, 0.5)";
    }
  }, [selectedColor]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  return (
    <Animated.View className="flex-1" style={[animatedBackgroundStyle]}>
      <TouchableWithoutFeedback
        accessible={false}
        onPress={() => {
          if (!isFocused) {
            Keyboard.dismiss();
          }
        }}
      >
        <View className="flex-1">
          <Header
            title={getPostTitle({ postId, prompt, recipientId, username })}
          />
          
          {selectedTab === "create" && (
            <TouchableWithoutFeedback
              accessible={false}
              onPress={() => {
                setTimeout(() => {
                  Keyboard.dismiss();
                }, 200);
              }}
            >
              <View
                className="flex-1 mt-0 overflow-hidden"
                style={[animatedBackgroundStyle]}
              >
                <View className="flex-1">
                  <KeyboardAvoidingView
                    behavior="padding"
                    className="flex-1 flex w-full"
                  >
                    <View className="flex-1 flex-column justify-start items-center">
                      <View className="w-full">
                        <RichTextInput
                          refresh={refreshingKey}
                          exportStyling={handleChangeFormat}
                          exportText={handleChangeText}
                          onFocus={handleChangeFocus}
                          withdrawKeyboard={withdrawKeyboard}
                        />
                      </View>
                    </View>
                  </KeyboardAvoidingView>
                </View>

                <View className="flex-1 flex-col items-center justify-center gap-2 absolute p-4 mt-4 right-0">
                  <View>
                    <ColorPickerSlider
                      colors={userColors}
                      selectedColor={trueColor as PostItColor}
                      onColorSelect={handleColorSelect}
                    />
                  </View>
                  <View>
                    <View className="flex flex-col items-center justify-center gap-2 py-2 rounded-[32px]">
                      <View>
                        <InteractionButton
                          label=""
                          icon={icons.wink}
                          emoji={selectedEmoji ? selectedEmoji : ""}
                          showLabel={false}
                          color={"#000000"}
                          onPress={() => setQuickEmojiSelectorVisible((prev) => !prev)}
                          size={"sm"}
                          styling="shadow-md"
                        />
                      </View>
                      {isQuickEmojiSelectorVisible && (
                        <View>
                          <EmojiShorthand
                            onEmojiSelected={(emoji: string) =>
                              handleEmojiSelect(emoji)
                            }
                            customShorthandEmojis={shorthandEmojis}
                          />
                        </View>
                      )}
                      {isQuickEmojiSelectorVisible && (
                        <View>
                          <InteractionButton
                            label=""
                            icon={icons.add}
                            emoji={""}
                            showLabel={false}
                            color={"#C1C1C1"}
                            onPress={toggleEmojiSelector}
                            size={"sm"}
                            styling="shadow-md"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
          
          {selectedTab === "customize" && (
            <View key={refreshingKey} className="absolute top-8">
              <PostContainer
                selectedPosts={draftPost ? [draftPost] : []}
                handleCloseModal={() => {}}
                isPreview={true}
                header={
                  <View className="absolute z-[10] top-28 right-5 flex flex-col items-center justify-end">
                    <InteractionButton
                      label={""}
                      icon={
                        !selectedStaticEmoji
                          ? icons.sparklesFill
                          : icons.sparkles
                      }
                      size="sm"
                      onPress={() => {
                        if (selectedEmoji) {
                          setSelectedStaticEmoji((prev) => !prev);
                          setRefreshingKey((prev) => prev + 1);
                        }
                      }}
                      showLabel={false}
                      color={""}
                    />
                  </View>
                }
                staticEmoji={selectedStaticEmoji}
              />
            </View>
          )}

          {isEmojiSelectorVisible && (
            <EmojiSelector
              showInModal={true}
              isVisible={true}
              onClose={() => toggleEmojiSelector()}
              onEmojiSelected={handleEmojiSelect}
              selectedEmoji={selectedEmoji}
              mode="both"
            />
          )}

          <CustomButtonBar buttons={navigationControls} />

          <RecentEmojiPopup
            visible={showRecentPopup}
            recentEmojis={recentEmojis}
            onEmojiSelect={handleEmojiSelect}
            onClose={() => {}}
            triggerPosition={triggerPosition}
            activeIndex={activeEmojiIndex}
          />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};
