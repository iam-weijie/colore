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
import ItemContainer from "@/components/ItemContainer";

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
          <View className="my-2 ml-2">
            <Text className="text-[16px] font-JakartaBold text-[#c1c1c1]"> Notes</Text>
          </View>
           <ItemContainer
            label="Answer a prompt"
            caption="You against a thought"
            icon={icons.heart}
            iconColor="#FAFAFA"
            onPress={() => {
              router.push("/root/new-post");
            }
            }
          />
          <ItemContainer
            label="Send temporary note"
            caption="Quick or it will disappear!"
            icon={icons.lock}
            iconColor="#FAFAFA"
            onPress={() => {
              router.push("/root/new-post");
            }
            }
          />
          <ItemContainer
            label="Send global note"
            caption="A thought for the world to see"
            icon={icons.plus}
            iconColor="#FAFAFA"
            onPress={() => {
              router.push("/root/new-post");
            }
            }
          />
          <ItemContainer
            label="Write a personal note"
            caption="A thought for your friends board"
            icon={icons.pencil}
            iconColor="#FAFAFA"
            onPress={() => {
              router.push({
                pathname: "root/new-post",
                params: {
                  recipient_id: user!.id,
                  username: "Yourself"
                }
              });
            }
            }
          />
          <View className="my-2 ml-2">
            <Text className="text-[16px] font-JakartaBold text-[#c1c1c1]"> Boards </Text>
          </View>
          <ItemContainer
            label="Create a board"
            icon={icons.menu}
            iconColor="#FAFAFA"
            onPress={() => {
              router.push({
                pathname: "root/new-board",
                params: {
                  type: 'personal',
                }
              });
            }
            }
          />
          <ItemContainer
            label="New community board"
            icon={icons.globe}
            iconColor="#FAFAFA"
            onPress={() => {
              router.push({
                pathname: "root/new-board",
                params: {
                  type: 'community',
                }
              });
            }
            }
          />
        </ScrollView>
      </SignedIn>
    </SafeAreaView>
  );
};


export default Create;
