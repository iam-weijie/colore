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

const NewPost = () => {
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
  const [boardComplete, setBoardComplete] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("Title");
  const [selectedModal, setSelectedModal] = useState<any | null>(null);
  const [selectedModalTitle, setSelectedModalTitle] = useState<string>("");
  const [inputHeight, setInputHeight] = useState(40);
  const [navigationIndex, setNavigationIndex] = useState<number>(0);
  const maxTitleCharacters = 20;
  const maxDescriptionCharacters = 300;
  
  // Ensure we have valid colors to select from
  const availableColors = userColors && userColors.length > 0 ? userColors : defaultColors;
  
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    availableColors[Math.floor(Math.random() * Math.min(availableColors.length, 3))]
  );
  const [isPosting, setIsPosting] = useState(false);

  console.log("type: ", type)
  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

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
        playSoundEffect(SoundType.Navigation)
        router.back();
      },
    },
    {
      icon: icons.add,
      label: "New Post",
      onPress: async () => {
        playSoundEffect(SoundType.Send)

        if (selectedTab !== "Restriction") {
          if (selectedTab === "Title" && boardTitle.length > 0) {
            setSelectedTab("Description");
          } else if (
            selectedTab === "Description" &&
            boardDescription.length > 0
          ) {
            setSelectedTab("Restriction");
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

  const allRestrictions = [
    {
      restriction: "privacy",
      description: `Choose Everyone to make your board public—anyone can view and post on it.
Select Private to keep it visible only to you.
Great for sharing or keeping things personal.`,
      options: [
        {
          label: "Private",
        },
        {
          label: "Everyone",
        },
      ],
    },
    {
      restriction: "comments",
      description: ` Enable Comments to let others reply and engage with your board.
Disable them to keep your board read-only.
Perfect for open discussions or quiet sharing.`,
      options: [
        {
          label: "commentsAllowed",
        },
        {
          label: "commentsDisabled",
        },
      ],
    },
  ];

  const restrictionsPersonalBoard = [
    {
      label: "Preying eyes",
      caption: "Choose who can see you board.",
      restriction: ["Private", "Everyone"],
      icon: icons.hide,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap)
        const restric = allRestrictions.find(
          (r) => r.restriction === "privacy"
        );
        if (!restric) {
          return;
        }
        setSelectedModal(
          <UniqueSelection
            options={restric.options}
            description={restric.description}
            selected={selectedPrivacy}
            onSelect={handleSelectedRectriction}
          />
        );
        setSelectedModalTitle("Privacy");
      },
    },
    {
      label: "Allow Comments",
      caption: "Can you receive comments?",
      restriction: ["commentsAllowed", "commentsDisabled"],
      icon: icons.comment,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap)
        const restric = allRestrictions.find(
          (r) => r.restriction === "comments"
        );
        if (!restric) {
          return;
        }
        const cleanedOptions = restric.options.map((option) => {
          return {
            label: option.label === "commentsDisabled" ? "Disabled" : "Allowed",
          };
        });
        setSelectedModal(
          <UniqueSelection
            options={cleanedOptions}
            description={restric.description}
            selected={selectedComments}
            onSelect={handleSelectedRectriction}
          />
        );
        setSelectedModalTitle("Comments");
      },
    }
  ];

  const restrictionsCommunityBoard = [
    {
      label: "On invite only",
      caption: "Choose who can see you board.",
      restriction: ["invite-needed", "public"],
      icon: icons.lock,
      iconColor: "#FAFAFA",
      onPress: () => {},
    },
    {
      label: "Location based",
      caption: "Is it bound to people in a certain location?",
      restriction: ["location-needed", ""],
      icon: icons.globe,
      iconColor: "#FAFAFA",
      onPress: () => {},
    },
    {
      label: "Allow Comments",
      caption: "Can you receive comments?",
      restriction: ["commentsAllowed", "commentsDisabled"],
      icon: icons.comment,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap)
        const restric = allRestrictions.find(
          (r) => r.restriction === "comments"
        );
        if (!restric) {
          return;
        }
        const cleanedOptions = restric.options.map((option) => {
          return {
            label: option.label === "commentsDisabled" ? "Disabled" : "Allowed",
          };
        });
        setSelectedModal(
          <UniqueSelection
            options={cleanedOptions}
            description={restric.description}
            selected={selectedComments}
            onSelect={handleSelectedRectriction}
          />
        );
        setSelectedModalTitle("Comments");
      },
    }
  ];

  const handleSelectedRectriction = (option: string) => {
    if (!boardRestriction.find((r) => r === option)) {
      if (option === "Everyone" || option === "Private") {
        setBoardRestriction((prev) => prev.filter((r) => r !== "Everyone"));
        setBoardRestriction((prev) => prev.filter((r) => r !== "Private"));
        setBoardRestriction((prev) => [...prev, option]);
        setSelectedPrivacy(option);
      }

      if (option === "Allowed" || option === "Disabled") {
        setBoardRestriction((prev) =>
          prev.filter((r) => r !== "commentsAllowed")
        );
        setBoardRestriction((prev) =>
          prev.filter((r) => r !== "commentsDisabled")
        );
        const fullOption =
          option === "Allowed" ? "commentsAllowed" : "commentsDisabled";
        setBoardRestriction((prev) => [...prev, fullOption]);
        setSelectedPrivacy(option);
      }
    }
  };

  useEffect(() => {
    console.log("restriction", boardRestriction);
    if (boardRestriction.length === 3) {
      setBoardComplete(true);
    } else {
      setBoardComplete(false);
    }
  }, [boardRestriction]);

  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handleMaxPost = (max: number) => {
    const numberRestrictions = ["4", "5", "6", "7", "8"];

    console.log("Current restrictions:", boardRestriction);
    console.log("Setting max to:", max);

    setBoardRestriction((prev) => {
      const filtered = prev.filter((r) => !numberRestrictions.includes(r));
      const newRestrictions = [...filtered, `${max}`];
      console.log("New restrictions:", newRestrictions);
      return newRestrictions;
    });

    setBoardMaxPosts(max);
  };

  const handleTabChange = (tabKey: string) => {
    console.log("Tab changed to:", tabKey);
    if (tabKey === "Description" && boardTitle.length === 0) {
      alertFieldEmpty();
      return;
    } else if (
      tabKey === "Restriction" &&
      boardTitle.length === 0 &&
      boardDescription.length === 0
    ) {
      alertFieldEmpty();
      return;
    } else {
      setSelectedTab(tabKey);
    }

    // You can add additional logic here when tabs change
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
          type: "personal",
          restrictions: boardRestriction,
        }),
      });

      router.back();
      router.push(`/root/tabs/personal-board`);
    } catch (error) {
      console.error("Couldn't submit prompt", error);
      showAlert({
        title: "Error",
        message: `Your prompt was not submitted.`,
        type: "ERROR",
        status: "error",
      });
    } finally {
      showAlert({
        title: "Prompt Submitted",
        message: `Your prompt was submitted successfully.`,
        type: "POST",
        status: "success",
        color: selectedColor?.hex || "#93c5fd",
      });

      console.log("submitted");
    }
  };

  const alertFieldEmpty = () => {
    showAlert({
      title: "Title cannot be empty",
      message: "Please give a title to the board",
      type: "ERROR",
      status: "error",
    });
  };

  useEffect(() => {
    // Ensure we have valid colors to select from
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
            title={boardTitle ? boardTitle : "New Board"}
            item={
              <Text className="text-[14px] font-Jakarta text-gray-500 pl-12 mr-6">
                {boardDescription}
              </Text>
            }
            tabs={tabs}
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            tabCount={0}
          />

          <View
            className="flex-1  overflow-hidden "
            style={{
              backgroundColor: selectedColor.hex,
            }}
          >
            {selectedTab !== "Restriction" ? (
              <View className="flex-1 -mt-32">
                  <View className="flex-1 flex-column justify-center items-center ">
                    <TextInput
                      className=" text-[24px] text-center text-white p-5 rounded-[24px] font-JakartaBold mx-10 "
                      placeholder={
                        selectedTab === "Title"
                          ? "Choose a name..."
                          : "What is this board about... "
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
              <View className="flex-1 ">
                  <View className="flex-1 mx-6 bg-white items-center justify-center my-4 px-8 pt-12 mb-[140px] rounded-[64px] overflow-hidden">
                <FlatList
                  data={type == "personal" ? restrictionsPersonalBoard : restrictionsCommunityBoard}
                  className="flex-1 w-full h-full"
                  keyExtractor={(item, index) =>
                    `restriction-${item.label}-${index}`
                  }
                  ListFooterComponent={

                 <Text className=" font-JakartaBold text-[14px] text-black mt-6">
                    {`Restrictions: ${boardRestriction.length} / 2`}
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
                  contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}
                  scrollEnabled={false} // disable scrolling if you're managing scroll elsewhere
                />
              </View>
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
      <CustomButtonBar buttons={navigationControls} />
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

export default NewPost;
