import React, { useEffect, useState, useCallback } from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import {
  Dimensions,
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
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
import { icons } from "@/constants";
import BoardGallery from "@/components/BoardGallery"
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalContext } from "@/app/globalcontext";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();
  const { userColors } = useGlobalContext();

  const [loading, setLoading] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("MyBoards");
  const [searchText, setSearchText] = useState<string>("");
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
            color: userColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
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
            color: userColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
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
            color: userColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
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
  




const handleClearSearch = () => {
  setSearchText("")
}
  return (
<View className="flex-1 bg-[#FAFAFA]">
      
    
        <View className="flex-1">
        <Header 
        title="Boards"
        tabs={tabs}
        selectedTab={selectedTab}
        onTabChange={handleTabChange} 
        tabCount={0}    />

            <View className=" z-10 flex flex-row items-center bg-white rounded-[24px] px-4 mt-4 h-12 mx-6"
        style={{
          boxShadow: "0 0 7px 1px rgba(120,120,120,.1)",
          width: '90%'
        }}
        >
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 pl-2 text-md "
            placeholder="Looking for a specific board..?"
             placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              className="w-6 h-6 items-center justify-center"
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      
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

