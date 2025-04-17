import React, { useEffect, useState, useCallback } from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  View,
  Image,
  Text,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import AntDesign from "@expo/vector-icons/AntDesign";
import PersonalBoard from "@/components/PersonalBoard";
import { icons, temporaryColors } from "@/constants";
import TabNavigation from "@/components/TabNavigation";
import { Board } from "@/types/type";
import EmojiBackground from "@/components/EmojiBackground";
import InteractionButton from "@/components/InteractionButton";
import BoardGallery from "@/components/BoardGallery"

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("MyBoards");
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
  const [myBoards, setMyBoards] = useState<any>();
  const [discoverBoards, setDiscoverBoards] = useState<any>();
  const [communityBoards, setCommunityBoards] = useState<any>();

  const handleNewPost = () => {
    router.push({
      pathname: "/root/new-personal-post",
      params: {
        recipient_id: user!.id,
        source: "board"
      },
    });
  };

  const fetchPersonalBoards = async () => {
    try {
      setLoading(true)
      const response = await fetchAPI(`/api/boards/getBoards?user_id=${user!.id}`,
          {
            method: "GET",
          }
      )
      if (response.error) {
        throw new Error(response.error);
      }

      const personalBoard =  {
        id: 0,
        title: "Personal Board",
        user_id: user!.id,
        description: "Your window to the world!",
        members_id: [user!.id],
        board_type: 'personal',
        restrictions: ['personal', 'commentsAllowed', '5'],
        created_at: Date.now(),
        color: "#93c5fd"
      }

        if (response.data) {
          const boardsWithColor = response.data.map((board: any, index: number) => ({
            ...board,
            color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
          }));
        
          setMyBoards([...boardsWithColor, personalBoard]);
        } else {
         
          setMyBoards(personalBoard)
        }

    } catch (error) {
      console.error("Failed to fetch board data:", error);
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunityBoards = async () => {
    try {
      setLoading(true)
      const response = await fetchAPI(`/api/boards/getCommunityBoards?user_id=${user!.id}`,
          {
            method: "GET",
          }
      )
      if (response.error) {
        throw new Error(response.error);
      }


      
          const boardsWithColor = response.data.map((board: any, index: number) => ({
            ...board,
            color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
          }));
        
          setCommunityBoards(boardsWithColor);

        

    } catch (error) {
      console.error("Failed to fetch board data:", error);
    } finally {
      setLoading(false)
    }
  }

  const fetchDiscoverBoards = async () => {
    try {
      setLoading(true)
      const response = await fetchAPI(`/api/boards/getDiscoverBoards`,
          {
            method: "GET",
          }
      )
      if (response.error) {
        throw new Error(response.error);
      }

        if (response.data) {
          const boardsWithColor = response.data.map((board: any, index: number) => ({
            ...board,
            color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
          }));
        
          setDiscoverBoards([...boardsWithColor]);
        }

    } catch (error) {
      console.error("Failed to fetch board data:", error);
    } finally {
      setLoading(false)
    }
  }


    useFocusEffect(
      useCallback(() => {
        fetchPersonalBoards()
        fetchDiscoverBoards()
        fetchCommunityBoards()
        //setShouldRefresh((prev) => prev + 1); // Increment refresh counter
      }, [])
    );
  




  // USE EFFECTS
  useEffect(() => {
    console.log("selected", selectedBoard, !!selectedBoard)
  }, [selectedBoard])

  return (
<View className="flex-1 ">
      <View className="flex-1 flex-row max-h-[16%] justify-between items-end pl-11  pr-6  bg-white z-10">

        <Text className={`text-2xl font-JakartaBold`}>
          Boards
          </Text>
        
      </View>
      <SignedIn>
        <View className="flex-1">
        <View className="flex flex-row items-center justify-start bg-white">
              <TabNavigation
                name={"Mine"}
                focused={selectedTab === "MyBoards"}
                onPress={() => {
                  setSelectedTab("MyBoards")
                }}
                notifications={0}
                color={"#CFB1FB"}/>
                 <TabNavigation
                name={"Community"}
                focused={selectedTab === "Community"}
                onPress={() => {
                  setSelectedTab("Community")
                }}
                notifications={0}
                color={"#CFB1FB"}/>
                <TabNavigation
                name={"Discover"}
                focused={selectedTab === "Discover"}
                onPress={() => {
                  setSelectedTab("Discover")
                }}
                notifications={0}
                color={"#93c5fd"}/>
            </View>
            {!loading ? (<View className="flex-1 overflow-hidden my-4">
        {selectedTab === "MyBoards" ? (
        <View className="flex-1">
          <BoardGallery
            boards={myBoards}
            />
          </View>) :
          selectedTab === "Community" ?  (
        <View className="flex-1">
                  <BoardGallery
                  boards={communityBoards}
                  />
                </View>
          ) : (
        <View className="flex-1">
          <BoardGallery
          boards={discoverBoards}
          />
        </View>)}
        </View>) : (
          <View className="flex-1 flex-row items-center justify-center">
            <ActivityIndicator
            size={"small"}
            color={"#888"}
            />
          </View>
        )}
       
        </View>
       
      </SignedIn>
</View>
  );
};

export default UserPersonalBoard;


/*

  {!!selectedBoard  && <TouchableOpacity onPress={() => {
        setSelectedBoard(null)
        setSelectedBoardTitle("")
        setSelectedBoardUserInfo("")
        setSelectedBoardId(0)
      }}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>}

  {!!selectedBoard  && <TouchableOpacity
                              onPress={() => {
                                 router.push({
                                                pathname: "root/new-post",
                                                params: {
                                                  recipient_id: user!.id,
                                                  boardId: selectedBoardId,
                                                  username: "Yourself"
                                                }
                                              });
                              }
                                }>
                              <Image
                              source={icons.plus}
                              className="w-5 h-5"
                              tintColor={"#000"} />
                              </TouchableOpacity>}*/