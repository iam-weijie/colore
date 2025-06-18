import React, { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import BoardGallery from "@/components/BoardGallery"
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import { useBoardsContext } from "@/app/contexts/BoardsContext";
import { checkTutorialStatus, completedTutorialStep } from "@/hooks/useTutorial";
import { boardTutorialPages } from "@/constants/tutorials";
import CarouselPage from "@/components/CarrousselPage";
import ModalSheet from "@/components/Modal";
import { Board } from "@/types/type";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();
  const { userColors } = useProfileContext();
  const { 
    personalBoards: rawPersonalBoards, 
    communityBoards: rawCommunityBoards,
    discoverBoards: rawDiscoverBoards,
    loading,
    refreshAllBoards 
  } = useBoardsContext();
  
  // Convert the boards to match the expected type with commentAllowed property
  const convertToTypedBoard = (board: any): Board => ({
    ...board,
    commentAllowed: board.restrictions?.includes("commentsAllowed") || true,
  });
  
  const personalBoards = rawPersonalBoards.map(convertToTypedBoard);
  const communityBoards = rawCommunityBoards.map(convertToTypedBoard);
  const discoverBoards = rawDiscoverBoards.map(convertToTypedBoard);
  
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

  const [selectedTab, setSelectedTab] = useState<string>("MyBoards");
  const [searchText, setSearchText] = useState<string>("");

  const tabs = [
    { name: "Mine", key: "MyBoards", color: "#CFB1FB", notifications: 0 },
    { name: "Community", key: "Community", color: "#CFB1FB" },
    { name: "Discover", key: "Discover", color: "#93c5fd", notifications: 0 }
  ];

  const handleTabChange = (tabKey: string) => {
    console.log("Tab changed to:", tabKey);
    setSelectedTab(tabKey);
  };

  // Refresh boards when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshAllBoards();
    }, [refreshAllBoards])
  );

  const handleClearSearch = () => {
    setSearchText("");
  };

  // Filter boards based on search text
  const filteredPersonalBoards = personalBoards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchText.toLowerCase()) ||
      board.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredCommunityBoards = communityBoards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchText.toLowerCase()) ||
      board.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredDiscoverBoards = discoverBoards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchText.toLowerCase()) ||
      board.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View className="flex-1 bg-white">
  <Header 
        title="Boards"
        tabs={tabs}
        selectedTab={selectedTab}
        onTabChange={handleTabChange} 
        tabCount={0}    />

            <View className=" z-10 flex flex-row items-center bg-white rounded-[24px] px-4 mt-4 h-12 mx-6"
        style={{
          boxShadow: "0 0 7px 1px rgba(120,120,120,.1)",
          width: '90%',
          marginTop: 24
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
      
      {loading ? (
        <ColoreActivityIndicator />
      ) : (
        selectedTab === "MyBoards" ? (
          <BoardGallery boards={filteredPersonalBoards} />
        ) : selectedTab === "Community" ? (
          <BoardGallery boards={filteredCommunityBoards} />
        ) : (
          <BoardGallery boards={filteredDiscoverBoards} />
        )
      )}
      
      {!skipIntro && !loading && (
        <ModalSheet
          title=""
          isVisible={!skipIntro}
          onClose={() => {}}
        >
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
        </ModalSheet>
      )}
    </View>
  );
};

export default UserPersonalBoard;

