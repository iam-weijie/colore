import React, { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import {
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import BoardGallery from "@/components/BoardGallery"
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import { checkTutorialStatus, completedTutorialStep } from "@/hooks/useTutorial";
import { boardTutorialPages } from "@/constants/tutorials";
import CarouselPage from "@/components/CarrousselPage";
import ModalSheet from "@/components/Modal";
import { defaultColors } from "@/constants/colors";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();
  const { userColors } = useProfileContext();
  
  // Tutorial constants
  
  const pages = boardTutorialPages;
  const totalSteps = pages.length;
  
  
  // Tutorial Logic
  const [skipIntro, setSkipIntro] = useState<boolean>(false);

  const fetchTutorialStatus = async () => {
    const isTutorialcompleted = await checkTutorialStatus("board-1")
    setSkipIntro(isTutorialcompleted)
  }
  const handleCompleteTutorial = async () => {
    const isCompleted = await completedTutorialStep("board-1")
    return isCompleted
  }
  
  useEffect(() => {
  fetchTutorialStatus()
  }, [])
  const [step, setStep] = useState(0);
    const handleNext = () => {
  
      if (step < totalSteps - 1) setStep((prev) => prev + 1);
      else {
        handleCompleteTutorial()
        setSkipIntro(true)
      }
    };

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
            color: defaultColors[Math.floor(Math.random() * 3)].hex, // only assign if not already set
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
            color: defaultColors[Math.floor(Math.random() * 3)].hex, // only assign if not already set
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
            color: defaultColors[Math.floor(Math.random() * 3)].hex, // only assign if not already set
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
      
    
        <View className="flex-1 relative">
        <Header 
        title="Boards"
        tabs={tabs}
        selectedTab={selectedTab}
        onTabChange={handleTabChange} 
        tabCount={0}    />

            <View className=" absolute z-10 flex flex-row items-center bg-white rounded-[24px] px-4 mt-4 h-12 mx-6"
        style={{
          boxShadow: "0 0 7px 1px rgba(120,120,120,.1)",
          width: '90%',
          marginTop: 170
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
            offsetY={64}
            />
          </View>) :
          selectedTab === "Community" ?  (
        <View className="flex-1">
                  <BoardGallery
                  boards={communityBoards}
                  offsetY={64}
                  />
                </View>
          ) : (
        <View className="flex-1">
          <BoardGallery
          boards={discoverBoards}
          offsetY={64}
          />
        </View>)}
        </View>) : (
          <View className="flex-1 items-center justify-center">
          <ColoreActivityIndicator text="Summoning Bob..." />
          </View>
        )}
       
        </View>
        {!skipIntro && <ModalSheet 
        title={""} 
        isVisible={!skipIntro} 
        onClose={() => {
          setSkipIntro(true)
          }} >
            <View className="flex-1 px-4">
            <CarouselPage
          label={pages[step].label}
          caption={pages[step].caption}
          color={pages[step].color}
          onSubmit={handleNext}
          progress={step + 1}
          total={totalSteps}
          disabled={pages[step].disabled}
        >
          {pages[step].children}
        </CarouselPage>
        </View>
        </ModalSheet>}
       
 
</View>
  );
};

export default UserPersonalBoard;

