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
import { useThemeColors, useBackgroundColor, useTextColor } from "@/hooks/useTheme";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();
  const { userColors } = useProfileContext();
  const colors = useThemeColors();
  const backgroundColor = useBackgroundColor();
  const textColor = useTextColor();
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
    allowedComments: board.restrictions?.includes("commentsAllowed") || true,
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
    { name: "Mine", key: "MyBoards", color: "#000", notifications: 0 },
    { name: "Community", key: "Community", color: "#000" },
    { name: "Discover", key: "Discover", color: "#000", notifications: 0 }
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
    <View style={{ flex: 1, backgroundColor: backgroundColor }}>
  <Header 
        title="Boards"
        tabs={tabs}
        selectedTab={selectedTab}
        onTabChange={handleTabChange} 
        tabCount={0}    />

            <View className=" z-10 flex flex-row items-center rounded-[24px] px-4 mt-4 h-12 mx-6"
        style={{
          backgroundColor: colors.surfaceSecondary,
          boxShadow: "0 0 7px 1px rgba(120,120,120,.1)",
          width: '90%',
          marginTop: 24
        }}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            className="flex-1 pl-2 text-md "
            placeholder="Looking for a specific board..?"
             placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            style={{ 
              color: textColor }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              className="w-6 h-6 items-center justify-center"
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      
      {loading ? (
        <View className="flex-1 flex items-center justify-center">
        <ColoreActivityIndicator />
        </View>
      ) : (
        selectedTab === "MyBoards" ? (
          <BoardGallery boards={filteredPersonalBoards} />
        ) : selectedTab === "Community" ? (
          <BoardGallery boards={filteredCommunityBoards} />
        ) : (
          <BoardGallery boards={filteredDiscoverBoards} />
        )
      )}
      

    </View>
  );
};

export default UserPersonalBoard;

