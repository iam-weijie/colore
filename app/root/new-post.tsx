import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";
import { SafeAreaView } from "react-native-safe-area-context";

import ColorSelector from "@/components/ColorSelector";
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";
import { useNavigationContext } from "@/components/NavigationContext";
import { useAlert } from '@/notifications/AlertContext';

const NewPost = () => {
  const { user } = useUser();
  const { content, color, emoji, recipient_id, username } = useLocalSearchParams();
  const { showAlert } = useAlert();
  
  const [postContent, setPostContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const maxCharacters = 3000;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors[Math.floor(Math.random() * 4)]
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isEmojiSelectorVisible, setIsEmojiSelectorVisible] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [fromPreview, setFromPreview] = useState(false);

  const [selectExpirationDate, setSelectExpirationDate] = useState<string>('14 days')

  const expirationDate = ['1 day', '3 days', '7 days', '14 days']

  // Initialize from route params when component mounts or params change
  useEffect(() => {
    if (content) {
      setPostContent(Array.isArray(content) ? content[0] : content as string);
      setFromPreview(true);
    }
    
    if (color) {
      const colorValue = Array.isArray(color) ? color[0] : color as string;
      const savedColor = temporaryColors.find(c => c.name === colorValue);
      if (savedColor) {
        setSelectedColor(savedColor);
      }
    }
    
    if (emoji) {
      setSelectedEmoji(Array.isArray(emoji) ? emoji[0] : emoji as string);
    }
  }, [content, color, emoji]);


  const handleColorSelect = (color: PostItColor) => {
    setSelectedColor(color);
    setIsEmojiSelectorVisible(false);
  };

  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handlePostSubmit = async () => {
    if (!!recipient_id) {
    console.log("normal post")
    router.push({
      pathname: "/root/preview-post",
      params: {
        id: "", 
        content: postContent, 
        color: selectedColor.name, 
        emoji: selectedEmoji,
        expiration: selectExpirationDate
      }
    });
  } else {
    console.log("personal post")
       router.push({
                   pathname: "/root/preview-post",
                   params: {
                     id: "", 
                     content: postContent, 
                     color: selectedColor.name, 
                     emoji: selectedEmoji, 
                     personal: "true", 
                     recipientId: recipient_id,
                     username: username,
                     expiration: selectExpirationDate
                   }
                 })
  }
  };

  const handleChangeText = (text: string) => {
    if (text.length <= maxCharacters) {
      setPostContent(text);
    } else {
      setPostContent(text.substring(0, maxCharacters));
      showAlert({
        title: 'Limit Reached',
        message: `You can only enter up to ${maxCharacters} characters.`,
        type: 'ERROR',
        status: 'error',
      });

    }
  };

  const toggleEmojiSelector = () => {
    setIsEmojiSelectorVisible((prev) => !prev);
    // console.log(selectedEmoji);
  };

   useEffect(() => {
     if (selectedEmoji && isEmojiSelectorVisible) {
       toggleEmojiSelector();
     }
   }, [selectedEmoji]);
   

  return (
    <SafeAreaView className="flex-1" >
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
         
        >
          <View className="flex-1" >
            <View className="flex flex-row justify-between items-center mt-6 mx-8">
            <View className="flex flex-row justify-start items-center ">
                <TouchableOpacity onPress={() => router.back()} className="mr-2">
                  <AntDesign name="caretleft" size={18} color="black" />
                </TouchableOpacity>
                <View className="">
              <Text className="  text-center text-xl font-JakartaBold text-black">
                New Post
              </Text>
              </View>
              
               
              

              
           
              
              {/*<CustomButton
                className="w-14 h-10 rounded-full shadow-none"
                fontSize="sm"
                title="Next"
                style={{backgroundColor: selectedColor.hex}}
                padding="0"
                onPress={handlePostSubmit}
                disabled={!postContent || isPosting}
              />*/}
            </View>
            {!!username ? (
                  <TouchableOpacity>
                  <Image
                  source={icons.addUser}
                  className="w-6 h-6"
                  tintColor={selectedColor.fontColor} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                  onPress={() => {
                    const currentIndex = expirationDate.indexOf(selectExpirationDate);
                    if (currentIndex < expirationDate.length - 1) {
                      setSelectExpirationDate(expirationDate[currentIndex + 1])
                    } else {
                      setSelectExpirationDate(expirationDate[0])
                    }
                  }}>
                   <Text className="  text-center text-[14px] font-JakartaBold" style={{
                    color: selectedColor.fontColor
                   }}>
                   Expire in : {selectExpirationDate}
                 </Text>
                 </TouchableOpacity>
                )
                }
            </View>

           <View className="flex-1 m-6 rounded-[48px]" style={{
            backgroundColor: selectedColor.hex
            }}>
            <KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">
          <View className="flex-1 flex-column justify-center items-center ">
            <View className="flex w-full mx-3">
              {!isEmojiSelectorVisible && (
                <View>
                <TextInput
                  className="text-[20px] text-white p-5 rounded-[24px] font-JakartaBold mx-10 "
                  placeholder="Type something..."
                  value={postContent}
                  onChangeText={handleChangeText}
                  onContentSizeChange={handleContentSizeChange}
                  autoFocus
                  multiline
                  scrollEnabled
                  style={{
                    paddingTop: 10,
                    paddingBottom: 0,
                    minHeight: screenHeight * 0.2,
                    maxHeight: screenHeight * 0.5,
                    textAlignVertical: "top",
                  }}
                />
                </View>
              )}
            </View>
    
           
             
              </View>
              
              </KeyboardAvoidingView>
              <View className="flex-1 absolute m-4 left-4 top-2" >
                <Text className="text-[16px] font-JakartaBold text-white">{username ? `To: ${username}` : ''}</Text>
              </View>
              <View  className="flex-1 flex-col items-end absolute p-4 right-0" >
              <ColorSelector
                colors={temporaryColors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
                //onColorSelect={setSelectedColor}
              />
              <View className="flex flex-row items-center">
              {selectedEmoji && <TouchableOpacity
              onPress={() => {setSelectedEmoji(null)}}>
                <Image
                  source={icons.close}
                  className="w-7 h-7"
                  tintColor={'#fff'}
                  />
              </TouchableOpacity>}
              <TouchableOpacity onPress={toggleEmojiSelector}>
                {selectedEmoji ? (
                  <Text style={{ fontSize: 35, margin: 1 }}>
                    {selectedEmoji}
                  </Text>
                ) : (
                  <Image source={icons.wink} className="w-8 h-9 m-1" tintColor={'#FFFFFF'} />
                )}
              </TouchableOpacity>
              </View>
              </View>
              </View>
              <View className="flex-1 absolute flex items-center w-full bottom-[10%]">
            <CustomButton
              className="w-[50%] h-16 rounded-full shadow-none bg-black"
              fontSize="lg"
              title="Continue"
              padding="0"
              onPress={handlePostSubmit}
              disabled={!postContent || isPosting}
            />
            </View>

            {isEmojiSelectorVisible && (
              <View className="w-full h-screen bg-white">
                <EmojiSelector
                  onEmojiSelected={(emoji) => {
                    if (emoji === selectedEmoji) {
                      setSelectedEmoji(null);
                    }
                    setSelectedEmoji(emoji);
                  }}
                />
              </View>
            )}
       
          </View>
        </TouchableWithoutFeedback>
      </SignedIn>
      </SafeAreaView>
  );
};


export default NewPost;
