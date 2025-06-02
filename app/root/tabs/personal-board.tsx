import React, { useEffect, useState, useCallback } from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import {
  Dimensions,
  View,
  Image,
  Text,
} from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import AntDesign from "@expo/vector-icons/AntDesign";
import PersonalBoard from "@/components/PersonalBoard";
import { icons, temporaryColors } from "@/constants";
import TabsContainer from "@/components/TabsContainer";
import { Board } from "@/types/type";
import EmojiBackground from "@/components/EmojiBackground";
import InteractionButton from "@/components/InteractionButton";
import BoardGallery from "@/components/BoardGallery"
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import Header from "@/components/Header";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("MyBoards");
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
  const [myBoards, setMyBoards] = useState<any>();
  const [discoverBoards, setDiscoverBoards] = useState<any>();
  const [communityBoards, setCommunityBoards] = useState<any>();

  const tabs = [
    { name: "Mine", key: "MyBoards", color: "#CFB1FB", notifications: 0 },
    { name: "Community", key: "Community", color: "#CFB1FB" },
    { name: "Discover", key: "Discover", color: "#93c5fd", notifications: 0 }
  ];

  const handleTabChange = (tabKey: string) => {
    console.log("Tab changed to:", tabKey);
    setSelectedTab(tabKey);
    // You can add additional logic here when tabs change
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
        id: -1,
        title: "Personal Board",
        user_id: user!.id,
        description: "Your window to the world!",
        members_id: [user!.id],
        board_type: 'personal',
        restrictions: ['personal', 'commentsAllowed', '5'],
        created_at: Date.now(),
        color: "#93c5fd"
      }

      const shareWithMeBoard =  {
        id: -2,
        title: "Shared with Me",
        user_id: user!.id,
        description: "Everything that was share with you!",
        members_id: [user!.id],
        board_type: 'personal',
        restrictions: ['personal', 'commentsAllowed', '5'],
        created_at: Date.now(),
        color: "#CFB1FB"
      }

        if (response.data) {
          const boardsWithColor = response.data.map((board: any, index: number) => ({
            ...board,
            color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
          }));
        
          setMyBoards([personalBoard, shareWithMeBoard, ...boardsWithColor]);
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
      const response = await fetchAPI(`/api/boards/getCommunityBoards?userId=${user!.id}`,
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
  






  return (
<View className="flex-1 bg-[#FAFAFA]">
      
    
        <View className="flex-1">
        <Header 
        title="Boards"
        tabs={tabs}
        selectedTab={selectedTab}
        onTabChange={handleTabChange} 
        tabCount={0}    />


      
            {!loading ? (<View className="flex-1 overflow-hidden ">
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
          <View className="flex-1 items-center justify-center">
          <ColoreActivityIndicator text="Summoning Bob..." />
          </View>
        )}
       
        </View>
       
 
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