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
import { useAlert } from '@/notifications/AlertContext';


const ItemContainer = ({label, icon, iconColor, onPress}: 
  {label: string, icon: ImageSourcePropType, iconColor: string, onPress: () => void}) => {
    return (
      <TouchableOpacity
      className="relative flex  mb-2 p-6 pr-7 rounded-[16px] w-full"
      style={{ 
        backgroundColor: "#FAFAFA" }}
      activeOpacity={0.6}
      onPress={() => {
        onPress();
      }}
    >
 
                  <View className="flex-row items-center justify-between w-full">
                   
                    <Text className="text-[16px] font-bold text-[#000] ">
                      {label}
                    </Text>
                    <Image
                      source={icon}
                      className="w-6 h-6"
                      style={{ tintColor: iconColor }}
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
            label="New post"
            icon={icons.plus}
            iconColor="#000"
            onPress={() => {
              router.push("/root/new-post");
            }
            }
          />
          <ItemContainer
            label="New personal post"
            icon={icons.pencil}
            iconColor="#000"
            onPress={() => {
              router.push("/root/new-personal-post");
            }
            }
          />
          <ItemContainer
            label="New personal board"
            icon={icons.menu}
            iconColor="#000"
            onPress={() => {
              //router.push("/root/new-group");
            }
            }
          />
          <ItemContainer
            label="New community board"
            icon={icons.globe}
            iconColor="#000"
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
