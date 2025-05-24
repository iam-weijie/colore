import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
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
import { icons, images, temporaryColors } from "@/constants";
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

const NewPost = () => {
  const { playSoundEffect } = useSoundEffects();


  const { user } = useUser();
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
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors[Math.floor(Math.random() * 4)]
  );
  const [isPosting, setIsPosting] = useState(false);

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
      icon: icons.send,
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

  const allRestricitons = [
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
        const restric = allRestricitons.find(
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
        const restric = allRestricitons.find(
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
    },
    {
      label: "# Notes",
      caption: "Select how many notes can be displayed!",
      restriction: ["4", "5", "6", "7", "8"],
      icon: icons.globe,
      iconColor: "#FAFAFA",
      onPress: async () => {
        playSoundEffect(SoundType.Tap)
        setSelectedModal(
          <NumberSelection minNum={4} maxNum={8} onSelect={handleMaxPost} />
        );
        setSelectedModalTitle("Maximum number of notes");
      },
    },
  ];

  const restrictionsCommunityBoard = [
    {
      label: "On invite only",
      caption: "Choose who can see you board.",
      icon: icons.lock,
      iconColor: "#FAFAFA",
      onPress: () => {},
    },
    {
      label: "Location based",
      caption: "Can you receive comments?",
      icon: icons.globe,
      iconColor: "#FAFAFA",
      onPress: () => {},
    },
    {
      label: "Show notes",
      caption: "Select how many notes can be displayed!",
      icon: icons.album,
      iconColor: "#FAFAFA",
      onPress: () => {},
    },
    {
      label: "Allow Anonymous Comments",
      caption: "Can you receive comments?",
      icon: icons.comment,
      iconColor: "#FAFAFA",
      onPress: () => {},
    },
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
      console.log("text", text, text.length <= maxDescriptionCharacters);
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
      await fetchAPI("/api/boards/newBoard", {
        method: "POST",
        body: JSON.stringify({
          clerkId: user!.id,
          title: boardTitle,
          description: boardDescription,
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
        color: selectedColor.hex,
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
    setSelectedColor(temporaryColors[Math.floor(Math.random() * 4)]);
  }, [navigationIndex]);

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
                <KeyboardAvoidingView
                  behavior="padding"
                  className="flex-1 flex w-full"
                >
                  <View className="flex-1 flex-column justify-center items-center ">
                    <TextInput
                      className=" text-[20px] text-center text-white p-5 rounded-[24px] font-JakartaBold mx-10 "
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
                      multiline={navigationIndex != 0}
                      style={{
                        paddingTop: 10,
                        paddingBottom: 0,
                        minHeight: screenHeight * 0.2,
                        maxHeight: screenHeight * 0.5,
                        textAlignVertical: "top",
                      }}
                    />
                  </View>
                </KeyboardAvoidingView>
              </View>
            ) : (
              <View className="flex-1">
                <ScrollView className="flex-1 mt-4 mx-6 py-6">
                  {restrictionsPersonalBoard.map((item) => (
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
                      iconColor={"#22c722"}
                      onPress={item.onPress}
                    />
                  ))}
                </ScrollView>
                <View className="bottom-40  items-center justify-center">
                  <Text className=" font-JakartaBold text-[14px] text-black">
                    {`Restrictions: ${boardRestriction.length} / 3`}
                  </Text>
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
