import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  View,
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";
import { SafeAreaView } from "react-native-safe-area-context";

import ColorSelector from "@/components/ColorSelector";
import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";
import { useNavigationContext } from "@/components/NavigationContext";
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '@/notifications/AlertContext';


const ItemContainer = ({label, icon, iconColor, onPress}: 
  {label: string, icon: ImageSourcePropType, iconColor: string, onPress: () => void}) => {
    return (
      <TouchableOpacity
      className="relative flex  mb-3 py-4 pl-3 pr-7 rounded-[24px] w-full"
      style={{ 
        backgroundColor: "#FAFAFA" }}
      activeOpacity={0.6}
      onPress={() => {
        onPress();
      }}
    >
              <View className="flex-1 flex flex-row items-center justify-between w-full">
                  <View className="flex-row items-center justify-start">
                  <LinearGradient
                      colors={['#fbb1d6', '#93c5fd']} // 🎨 your gradient colors
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="rounded-[16px] p-[4px] mx-3" // outer border rounding and padding
                    >
                    <View className="flex-row items-center rounded-[14px] p-2">
                    <Image
                      source={icon}
                      className="w-5 h-5"
                      style={{ tintColor: iconColor }}
                    />
                    </View>
                  </LinearGradient>
                  
                    <Text className="text-[14px] font-bold text-[#000] ">
                      {label}
                    </Text>
                    </View>
                    <Image
                      source={icons.chevron}
                      className="w-5 h-5"
                      style={{ tintColor: "#000" }}
                    />
                  </View>
               
             
            </TouchableOpacity>
            
    )
}
const Create = () => {
  const { user } = useUser();
  const { content, color, emoji } = useLocalSearchParams();
  const { showAlert } = useAlert();
  
  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
          
          <View className="flex-row justify-between items-center mx-7 mt-3">
                 <Text className="text-2xl font-JakartaBold mt-4">Create</Text>
              
               </View>
        </TouchableWithoutFeedback>
        <ScrollView 
        className="flex-1 mt-4 mx-6"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}>
          <ItemContainer
            label="New global post"
            icon={icons.plus}
            iconColor="#FAFAFA"
            onPress={() => {
              router.push("/root/new-post");
            }
            }
          />
          <ItemContainer
            label="New personal post"
            icon={icons.pencil}
            iconColor="#FAFAFA"
            onPress={() => {
              router.push("/root/new-personal-post");
            }
            }
          />
          <ItemContainer
            label="New personal board"
            icon={icons.menu}
            iconColor="#FAFAFA"
            onPress={() => {
              //router.push("/root/new-group");
            }
            }
          />
          <ItemContainer
            label="New community board"
            icon={icons.globe}
            iconColor="#FAFAFA"
            onPress={() => {
              //router.push("/root/new-collection");
            }
            }
          />
        </ScrollView>
      </SignedIn>
    </SafeAreaView>
  );
};


export default Create;
