import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Header from "@/components/Header";
import CardCarrousel from "@/components/CardCarroussel";
import { RenderCreateCard } from "@/components/RenderCard";
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '@/notifications/AlertContext';
import ItemContainer from "@/components/ItemContainer";
import EmojiBackground from "@/components/EmojiBackground";
import { fetchAPI } from "@/lib/fetch";
import { icons } from "@/constants";
import { 
  addDays
} from 'date-fns';

const Create = () => {
  const { user } = useUser();
  const { content, color, emoji } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const [selectedTab, setSelectedTab] = useState<string>("notes");

  const tabs = [
    { name: "Prompts", key: "prompts", color: "#CFB1FB", notifications: 0 },
    { name: "Notes", key: "notes", color: "#CFB1FB" },
    { name: "Boards", key: "boards", color: "#93c5fd", notifications: 0 }
  ];

  const promptOptions = [
    {
      label: "Answer a prompt", 
      icon: icons.fire ,
      caption: "You and a random thought!", 
      onPress: () => handlePromptSubmit()}
  ]
  const notesOptions = [
    {
      label: "Temporary Notes", 
      icon: icons.timer ,
      caption: "Quick, it will disappear!", 
      onPress: () => {
      router.push({
        pathname: "root/new-post",
        params: {
          expiration: new Date(addDays(new Date(), 3)).toISOString(), 
        }
      });
    }
  },
    {
      label: "Global Notes", 
      icon: icons.globe ,
      caption: "A thought for the world to see!", 
      onPress: () => {
        router.push({
          pathname: "root/new-post"
        });
      }
     },
    {
      label: "Personal Notes", 
      icon: icons.lock ,
      caption: "A thought? Write in here!", 
      onPress: () => {
        router.push({
          pathname: "root/new-post",
          params: {
            recipientId: user!.id,
            username: "Yourself"
          }
        });
      } }
  ]

  const boardOptions = [
    {
      label: "Private Board", 
      icon: icons.bookmark ,
      caption: "Only you can post here!", 
      onPress: () => {
        router.push({
          pathname: "root/new-board",
          params: {
            type: 'personal',
          }
        });
      } },
    {label: "Community Board", 
      icon: icons.comment,
      caption: "Hear everyone's thoughts!", onPress: () => {
      router.push({
        pathname: "root/new-board",
        params: {
          type: 'community',
        }
      });
    }}
  ]
  const handleTabChange = (tabKey: string) => {
    console.log("Tab changed to:", tabKey);
    setSelectedTab(tabKey);
    // You can add additional logic here when tabs change
  };


  const handlePromptSubmit = async () => {

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
    
  
  
  return (
    <View className="flex-1">
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
       
          
                    
            <Header 
            title="Create"
            tabs={tabs}
            selectedTab={selectedTab}
            onTabChange={handleTabChange} 
            tabCount={0}  
            />
        </TouchableWithoutFeedback>
        <EmojiBackground 
        emoji=""
        color="#93c5fd"
        />
        <View className="flex-1 mb-[90px]">
        <CardCarrousel
            items={
              selectedTab == "prompts" ? promptOptions : 
              (selectedTab == "notes") ? notesOptions : 
              boardOptions
            }
            renderItem={(item, index) => 
              <RenderCreateCard
          item={item}
          handleOptionSubmit={() => item.onPress()}
          />}/>
        </View>
        {/*
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
            colors={['#FBB1F5', '#93c5fd'] as [string, string]}
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
            colors={['#FBB1F5', '#93c5fd'] as [string, string]}
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
            colors={['#FBB1F5', '#93c5fd'] as [string, string]}
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
            colors={['#FBB1F5', '#93c5fd'] as [string, string]}
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
            colors={['#FBB1F5', '#93c5fd'] as [string, string]}
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
        */}
    </View>
  );
};


export default Create;
