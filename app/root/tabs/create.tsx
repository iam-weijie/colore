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
import EmojiBackground from "@/components/EmojiBackground";

const Create = () => {
  const { user } = useUser();
  const { content, color, emoji } = useLocalSearchParams();
  const { showAlert } = useAlert();
  
  return (
    <View className="flex-1">
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
       
          
                    
            <View className="flex-1 flex-row max-h-[18%] justify-between items-end pl-11  bg-[#FAFAFA] z-10">
                 <Text className="text-2xl font-JakartaBold my-4">Create</Text>
              
               </View>
        </TouchableWithoutFeedback>
        <EmojiBackground 
        emoji=""
        color="#93c5fd"
        />
        <ScrollView 
        className="flex-1 pt-2 mx-6"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}>
          <View className="my-3 ml-2">
            <Text className="text-[16px] font-JakartaBold text-gray-100"> Prompts</Text>
          </View>
          <ItemContainer
            label="Answer a prompt"
            caption="You and a random thought"
            icon={icons.fire}
            colors={['#fbb1d6', '#93c5fd'] as [string, string]}
            iconColor="#888"
            actionIcon={icons.chevron}
            onPress={async () => {

              let prompt;

              try {
                    const response = await fetchAPI(
                      `/api/prompts/getPrompts`
                    );
                 
                    const uniquePrompts = response.data.filter((value, index, self) => 
                      index === self.findIndex((t) => (
                        t.cue === value.cue // Compare by cue
                      ))
                    );

                    let randomIndex = Math.floor(Math.random() * uniquePrompts.length);
                    prompt = uniquePrompts[randomIndex];
              
                  } catch (error) {
                    console.error("Failed to fetch posts:", error);
                  } finally {
                    router.push({
                      pathname: "root/new-post",
                      params: {
                        prompt: prompt.content,
                        promptId: prompt.id
                      }
                    });
                  }

             
            }
            }
          />
          <View className="my-2 ml-2">
            <Text className="text-[16px] font-JakartaBold  text-gray-100"> Notes</Text>
          </View>
       
          <ItemContainer
            label="Send temporary note"
            caption="Quick or it will disappear!"
            icon={icons.timer}
            colors={['#fbb1d6', '#93c5fd'] as [string, string]}
            iconColor="#888"
            actionIcon={icons.chevron}
            onPress={() => {
              router.push({
                pathname: "root/new-post",
                params: {
                  expiration: '3 days' 
                }
              });
            }
            }
          />
          <ItemContainer
            label="Send global note"
            caption="A thought for the world to see"
            icon={icons.globe}
            colors={['#fbb1d6', '#93c5fd'] as [string, string]}
            iconColor="#888"
            actionIcon={icons.chevron}
            onPress={() => {
              router.push({
                pathname: "root/new-post"
              });
            }
            }
          />
          <ItemContainer
            label="Write a personal note"
            caption="A thought for your friends board"
            icon={icons.pencil}
            colors={['#fbb1d6', '#93c5fd'] as [string, string]}
            iconColor="#888"
            actionIcon={icons.chevron}
            onPress={() => {
              router.push({
                pathname: "root/new-post",
                params: {
                  recipientId: user!.id,
                  username: "Yourself"
                }
              });
            }
            }
          />
          <View className="my-2 ml-2">
            <Text className="text-[16px] font-JakartaBold  text-gray-100"> Boards </Text>
          </View>
          <ItemContainer
            label="Create a board"
            icon={icons.bookmark}
            colors={['#fbb1d6', '#93c5fd'] as [string, string]}
            iconColor="#888"
            actionIcon={icons.chevron}
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
      
        </ScrollView>
    </View>
  );
};


export default Create;
