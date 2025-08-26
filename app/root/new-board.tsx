import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import EmojiSelector from "@/components/EmojiSelector";
import { LinearGradient } from "expo-linear-gradient";
import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";
import { useNavigationContext } from "@/components/NavigationContext";
import { useAlert } from "@/notifications/AlertContext";
import TabNavigation from "@/components/TabNavigation";
import ItemContainer from "@/components/ItemContainer";
import ModalSheet from "@/components/Modal";
import MaskedView from "@react-native-masked-view/masked-view";
import { UniqueSelection, NumberSelection } from "@/components/Selector";
import Header from "@/components/Header";
import { CustomButtonBar } from "@/components/CustomTabBar";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { encryptText } from "@/lib/encryption";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import { defaultColors } from "@/constants/colors";

const NewBoard = () => {
  const { playSoundEffect } = useSoundEffects();
  const { user } = useUser();
  const { userColors } = useProfileContext();
  const { encryptionKey } = useEncryptionContext();
  const { type } = useLocalSearchParams();
  const { showAlert } = useAlert();

  const [boardTitle, setBoardTitle] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [boardRestriction, setBoardRestriction] = useState<string[]>([]);
  const [boardMaxPosts, setBoardMaxPosts] = useState<number | null>(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState("Private");
  const [selectedComments, setSelectedComments] = useState("Allowed");
  const [selectedVisibility, setSelectedVisibility] = useState("invite-needed"); // For community boards
  const [isLocationBased, setIsLocationBased] = useState(false);
  const [boardComplete, setBoardComplete] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("Title");
  const [selectedModal, setSelectedModal] = useState<any | null>(null);
  const [selectedModalTitle, setSelectedModalTitle] = useState<string>("");
  const [inputHeight, setInputHeight] = useState(40);
  const [navigationIndex, setNavigationIndex] = useState<number>(0);
  
  const maxTitleCharacters = 20;
  const maxDescriptionCharacters = 50;
  
  const availableColors = userColors && userColors.length > 0 ? userColors : defaultColors;
  
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    availableColors[Math.floor(Math.random() * Math.min(availableColors.length, 3))]
  );
  const [isPosting, setIsPosting] = useState(false);

  const screenHeight = Dimensions.get("screen").height;
  const boardType = type as string;

  const tabs = [
    { name: "Title", key: "Title", color: "#000" },
    { name: "Description", key: "Description", color: "#000" },
    { name: "Restriction", key: "Restriction", color: "#000" },
  ];

  const navigationControls = [
    {
      icon: icons.back,
      label: "Back",
      onPress: async () => {
        playSoundEffect(SoundType.Navigation);
        router.back();
      },
    },
    {
      icon: icons.add,
      label: "Create Board",
      onPress: async () => {
        playSoundEffect(SoundType.Send);

        if (selectedTab !== "Restriction") {
          if (selectedTab === "Title" && boardTitle.length > 0) {
            setSelectedTab("Description");
          } else if (
            selectedTab === "Description" &&
            boardDescription.length > 0
          ) {
            setSelectedTab("Restriction");
          } else {
            alertFieldEmpty();
          }
        } else {
          if (!boardComplete) {
            showAlert({
              title: "Incomplete Board",
              message: "Please complete all required fields before submitting.",
              type: "ERROR",
              status: "error",
            });
            return;
          }

          handleBoardSubmit();
        }
      },
      isCenter: true,
    },
    {
      icon: icons.settings,
      label: "More",
      onPress: () => {},
      isCenter: true,
    },
  ];

  // Updated restriction configurations
  const allRestrictions = [
    {
      restriction: "privacy",
      description: `Choose Everyone to make your board public—anyone can view and post on it.
Select Private to keep it visible only to you.
Great for sharing or keeping things personal.`,
      options: [
        { label: "Private" },
        { label: "Everyone" },
      ],
    },
    {
      restriction: "visibility",
      description: `Choose "Invite Only" to require invites for access.
Select "Public" to make it discoverable by everyone.
Perfect for controlled or open communities.`,
      options: [
        { label: "Invite Only" },
        { label: "Public" },
      ],
    },
    {
      restriction: "location",
      description: `Enable location-based access to restrict the board to people in a specific area.
Disable to allow access from anywhere.`,
      options: [
        { label: "Location Required" },
        { label: "No Location" },
      ],
    },
    {
      restriction: "comments",
      description: `Enable Comments to let others reply and engage with your board.
Disable them to keep your board read-only.
Perfect for open discussions or quiet sharing.`,
      options: [
        { label: "Allowed" },
        { label: "Disabled" },
      ],
    },
  ];

  const restrictionsPersonalBoard = [
    {
      label: "Privacy Settings",
      caption: "Choose who can see your board.",
      restriction: ["Private", "Everyone"],
      icon: icons.hide,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap);
        const restric = allRestrictions.find(r => r.restriction === "privacy");
        if (!restric) return;
        
        setSelectedModal(
          <UniqueSelection
            options={restric.options}
            description={restric.description}
            selected={selectedPrivacy}
            onSelect={(option) => handleRestrictionSelection("privacy", option)}
          />
        );
        setSelectedModalTitle("Privacy Settings");
      },
    },
    {
      label: "Comments",
      caption: "Allow others to comment on your board?",
      restriction: ["Allowed", "Disabled"],
      icon: icons.comment,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap);
        const restric = allRestrictions.find(r => r.restriction === "comments");
        if (!restric) return;
        
        setSelectedModal(
          <UniqueSelection
            options={restric.options}
            description={restric.description}
            selected={selectedComments}
            onSelect={(option) => handleRestrictionSelection("comments", option)}
          />
        );
        setSelectedModalTitle("Comment Settings");
      },
    },
  ];

  const restrictionsCommunityBoard = [
    {
      label: "Board Visibility",
      caption: "Control who can discover and join your board.",
      restriction: ["invite-needed", "public"],
      icon: icons.lock,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap);
        const restric = allRestrictions.find(r => r.restriction === "visibility");
        if (!restric) return;
        
        setSelectedModal(
          <UniqueSelection
            options={restric.options}
            description={restric.description}
            selected={selectedVisibility === "invite-needed" ? "Invite Only" : "Public"}
            onSelect={(option) => handleRestrictionSelection("visibility", option)}
          />
        );
        setSelectedModalTitle("Visibility Settings");
      },
    },
    {
      label: "Location Access",
      caption: "Restrict access based on location?",
      restriction: ["location-needed", "no-location"],
      icon: icons.globe,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap);
        const restric = allRestrictions.find(r => r.restriction === "location");
        if (!restric) return;
        
        setSelectedModal(
          <UniqueSelection
            options={restric.options}
            description={restric.description}
            selected={isLocationBased ? "Location Required" : "No Location"}
            onSelect={(option) => handleRestrictionSelection("location", option)}
          />
        );
        setSelectedModalTitle("Location Settings");
      },
    },
    {
      label: "Comments",
      caption: "Allow community members to comment?",
      restriction: ["Allowed", "Disabled"],
      icon: icons.comment,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap);
        const restric = allRestrictions.find(r => r.restriction === "comments");
        if (!restric) return;
        
        setSelectedModal(
          <UniqueSelection
            options={restric.options}
            description={restric.description}
            selected={selectedComments}
            onSelect={(option) => handleRestrictionSelection("comments", option)}
          />
        );
        setSelectedModalTitle("Comment Settings");
      },
    },
  ];

  // Improved restriction handling
  const handleRestrictionSelection = (type: string, option: string) => {
    switch (type) {
      case "privacy":
        setSelectedPrivacy(option);
        setBoardRestriction(prev => {
          const filtered = prev.filter(r => !["Private", "Everyone"].includes(r));
          return [...filtered, option];
        });
        break;
        
      case "visibility":
        const visibilityValue = option === "Invite Only" ? "invite-needed" : "public";
        setSelectedVisibility(visibilityValue);
        setBoardRestriction(prev => {
          const filtered = prev.filter(r => !["invite-needed", "public"].includes(r));
          return [...filtered, visibilityValue];
        });
        break;
        
      case "location":
        const isLocationRequired = option === "Location Required";
        setIsLocationBased(isLocationRequired);
        const locationValue = isLocationRequired ? "location-needed" : "no-location";
        setBoardRestriction(prev => {
          const filtered = prev.filter(r => !["location-needed", "no-location"].includes(r));
          return [...filtered, locationValue];
        });
        break;
        
      case "comments":
        setSelectedComments(option);
        const commentsValue = option === "Allowed" ? "commentsAllowed" : "commentsDisabled";
        setBoardRestriction(prev => {
          const filtered = prev.filter(r => !["commentsAllowed", "commentsDisabled"].includes(r));
          return [...filtered, commentsValue];
        });
        break;
    }
  };

  // Check if board is complete based on type
  useEffect(() => {
    if (boardType === "personal") {
      // Personal boards need privacy and comments settings
      const hasPrivacy = boardRestriction.some(r => ["Private", "Everyone"].includes(r));
      const hasComments = boardRestriction.some(r => ["commentsAllowed", "commentsDisabled"].includes(r));
      setBoardComplete(hasPrivacy && hasComments);
    } else if (boardType === "community") {
      // Community boards need visibility, location, and comments settings
      const hasVisibility = boardRestriction.some(r => ["invite-needed", "public"].includes(r));
      const hasLocation = boardRestriction.some(r => ["location-needed", "no-location"].includes(r));
      const hasComments = boardRestriction.some(r => ["commentsAllowed", "commentsDisabled"].includes(r));
      setBoardComplete(hasVisibility && hasLocation && hasComments);
    }
  }, [boardRestriction, boardType]);

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handleTabChange = (tabKey: string) => {
    if (tabKey === "Description" && boardTitle.length === 0) {
      alertFieldEmpty();
      return;
    } else if (tabKey === "Restriction" && (boardTitle.length === 0 || boardDescription.length === 0)) {
      if (boardTitle.length === 0) {
        alertFieldEmpty();
      } else {
        showAlert({
          title: "Description Required",
          message: "Please add a description to the board",
          type: "ERROR",
          status: "error",
        });
      }
      return;
    }
    setSelectedTab(tabKey);
  };

  const handleChangeText = (text: string) => {
    if (selectedTab === "Title") {
      if (text.length <= maxTitleCharacters) {
        setBoardTitle(text);
      } else {
        setBoardTitle(text.substring(0, maxTitleCharacters));
        showAlert({
          title: "Limit Reached",
          message: `You can only enter up to ${maxTitleCharacters} characters.`,
          type: "ERROR",
          status: "error",
        });
      }
    }
    if (selectedTab === "Description") {
      if (text.length <= maxDescriptionCharacters) {
        setBoardDescription(text);
      } else {
        setBoardDescription(text.substring(0, maxDescriptionCharacters));
        showAlert({
          title: "Limit Reached",
          message: `You can only enter up to ${maxDescriptionCharacters} characters.`,
          type: "ERROR",
          status: "error",
        });
      }
    }
  };

  const handleBoardSubmit = async () => {
    if (isPosting) return; // Prevent double submission
    
    setIsPosting(true);
    
    try {
      const isPrivate = selectedPrivacy === "Private" && Boolean(encryptionKey);

      const encryptedTitle = isPrivate ? encryptText(boardTitle, encryptionKey!) : boardTitle;
      const encryptedDescription = isPrivate ? encryptText(boardDescription, encryptionKey!) : boardDescription;

      await fetchAPI("/api/boards/newBoard", {
        method: "POST",
        body: JSON.stringify({
          clerkId: user!.id,
          title: encryptedTitle,
          description: encryptedDescription,
          type: boardType,
          restrictions: boardRestriction,
          maxPosts: boardMaxPosts,
        }),
      });

      showAlert({
        title: "Board Created",
        message: `Your ${boardType} board was created successfully.`,
        type: "POST",
        status: "success",
        color: selectedColor?.hex || "#93c5fd",
      });

      router.back();
      
      // Navigate to appropriate board screen
        router.push(`/root/tabs/personal-board`);

      
    } catch (error) {
      console.error("Couldn't submit board", error);
      showAlert({
        title: "Error",
        message: `Your board was not created. Please try again.`,
        type: "ERROR",
        status: "error",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const alertFieldEmpty = () => {
    showAlert({
      title: "Title Required",
      message: "Please give a title to the board",
      type: "ERROR",
      status: "error",
    });
  };

  // Get current restrictions for display
  const getCurrentRestrictions = () => {
    if (boardType === "personal") {
      return restrictionsPersonalBoard;
    }
    return restrictionsCommunityBoard;
  };

  const getRequiredRestrictionCount = () => {
    return boardType === "personal" ? 2 : 3;
  };

  useEffect(() => {
    const availableColors = userColors && userColors.length > 0 ? userColors : defaultColors;
    setSelectedColor(availableColors[Math.floor(Math.random() * Math.min(availableColors.length, 3))]);
  }, [navigationIndex, userColors]);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: selectedColor.hex,
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => Keyboard.dismiss()}
        onPressIn={() => Keyboard.dismiss()}
      >
        <View className="flex-1">
          <Header
            title={boardTitle ? boardTitle : `New ${boardType === 'personal' ? 'Personal' : 'Community'} Board`}
            item={
              <Text className="text-[14px] font-Jakarta text-gray-500 pl-8">
                {boardDescription}
              </Text>
            }
            tabs={tabs}
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            tabCount={0}
          />

          <View
            className="flex-1 overflow-hidden"
            style={{
              backgroundColor: selectedColor.hex,
            }}
          >
            {selectedTab !== "Restriction" ? (
              <View className="flex-1 -mt-32">
                
                <View className="flex-1 flex-column justify-center items-center">                  {/* Character count */}
                  <Text className="text-white/70 text-[12px] font-Jakarta mt-2">
                    {selectedTab === "Title" 
                      ? `${boardTitle.length}/${maxTitleCharacters}` 
                      : `${boardDescription.length}/${maxDescriptionCharacters}`
                    }
                  </Text>
                  <TextInput
                    className="text-[24px] text-center text-white p-5 rounded-[24px] font-JakartaBold mx-10"
                    placeholder={
                      selectedTab === "Title"
                        ? "Choose a name..."
                        : "What is this board about..."
                    }
                    value={
                      selectedTab === "Title" ? boardTitle : boardDescription
                    }
                    placeholderTextColor={"#F1F1F1"}
                    onChangeText={handleChangeText}
                    onContentSizeChange={handleContentSizeChange}
                    autoFocus
                    scrollEnabled
                    multiline={selectedTab !== "Title"}
                    style={{
                      paddingTop: 10,
                      paddingBottom: 0,
                      minHeight: screenHeight * 0.2,
                      maxHeight: screenHeight * 0.5,
                      textAlignVertical: "top",
                    }}
                  />
                
                </View>
              </View>
            ) : (
              <View className="flex-1">
                <View className="flex-1 mx-6 bg-white items-center justify-center my-4 px-8 pt-12 mb-[140px] rounded-[64px] overflow-hidden">
                  <Text className="font-JakartaBold text-[18px] text-black mb-6 text-center">
                    {boardType === "personal" ? "Personal Board Settings" : "Community Board Settings"}
                  </Text>
                  
                  <FlatList
                    data={getCurrentRestrictions()}
                    className="flex-1 w-full h-full"
                    keyExtractor={(item, index) =>
                      `restriction-${item.label}-${index}`
                    }
                    ListFooterComponent={
                      <Text className="font-JakartaBold text-[14px] text-black mt-6 text-center">
                        {`Settings: ${boardRestriction.length} / ${getRequiredRestrictionCount()}`}
                      </Text>
                    }
                    renderItem={({ item }) => (
                      <ItemContainer
                        label={item.label}
                        caption={item.caption}
                        icon={item.icon}
                        colors={
                          ["#FBB1F5", selectedColor.hex] as [string, string]
                        }
                        actionIcon={
                          boardRestriction.some((r) =>
                            item.restriction.includes(r)
                          ) && icons.check
                        }
                        iconColor="#22c722"
                        onPress={item.onPress}
                      />
                    )}
                    contentContainerStyle={{ 
                      alignItems: "center", 
                      justifyContent: "center",
                      paddingBottom: 20 
                    }}
                    scrollEnabled={true}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
      
      <CustomButtonBar 
        buttons={navigationControls.map(btn => 
          btn.label === "Create Board" ? { ...btn, disabled: isPosting } : btn
        )} 
      />
      
      {!!selectedModal && (
        <ModalSheet
          title={selectedModalTitle}
          isVisible={!!selectedModal}
          onClose={() => {
            setSelectedModal(null);
            setSelectedModalTitle("");
          }}
        >
          {selectedModal}
        </ModalSheet>
      )}
    </View>
  );
};

export default NewBoard;