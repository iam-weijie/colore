import PostItBoard from "@/components/PostItBoard";
import { fetchAPI } from "@/lib/fetch";
import { Post, PostWithPosition, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";

import { icons, countries } from "@/constants";
import { router, useFocusEffect } from "expo-router";
import {
  Dimensions,
  Image,
  Modal,
  ImageSourcePropType,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  BounceIn,
  FadeIn,
  FadeOut,
  withTiming,
} from "react-native-reanimated";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import { useGlobalContext } from "@/app/globalcontext";
import DropdownMenu from "@/components/DropdownMenu";

import Action from "@/components/InfoScreen";
import { useAlert } from "@/notifications/AlertContext";

import { ActionType } from "@/lib/prompts";
import { GeographicalMode } from "@/types/type";
import UserInfo from "../user-info";

import { ChatScreen, NotificationScreen } from "../chat/chat-screen";
import NotificationBubble from "@/components/NotificationBubble";
import ItemContainer from "@/components/ItemContainer";
import ModalSheet from "@/components/Modal";
import Header from "@/components/Header";
import * as Haptics from "expo-haptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export default function Page() {
 const { playSoundEffect } = useSoundEffects()


  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { isIpad, unreadComments, unreadPersonalPosts, profile } = useGlobalContext();
  const [action, setAction] = useState(ActionType.NONE);
  const { showAlert } = useAlert();
  const [geographicalMode, setGeographicalMode] =
    useState<GeographicalMode>("world");
  const userInfo = profile;
  const [selectedModal, setSelectedModal] = useState<Function | null>(null);
  const [activeModalTitle, setActiveModalTitle] = useState<string>("");

  const requestPermission = async () => {
    const status = await requestTrackingPermission();
    if (status === "authorized") {
      console.log("Tracking permission granted!");
    } else {
      console.log("Tracking permission denied or restricted.");
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  const screenHeight = Dimensions.get("screen").height;
  const screenWidth = Dimensions.get("screen").width;
  const AlgorithmRandomPosition = (isPinned: boolean) => {
    if (isPinned) {
      return { top: 60 + Math.random() * 10, left: 40 + Math.random() * 10 };
    } else if (isIpad) {
      const top =
        ((Math.random() - 0.5) * 2 * screenHeight) / 3 + screenHeight / 4;
      const left =
        ((Math.random() - 0.5) * 2 * screenWidth) / 3 +
        screenWidth -
        screenWidth / 1.75;
      return {
        top: top,
        left: left,
      };
    } else {
      const top =
        ((Math.random() - 0.5) * 2 * screenHeight) / 4 + screenHeight / 4;
      const left =
        ((Math.random() - 0.5) * 2 * screenWidth) / 4 + screenWidth / 4;
      return {
        top: top,
        left: left,
      };
    }
  };

  const fetchPosts = async () => {
    const response = await fetchAPI(
      `/api/posts/getRandomPosts?number=${isIpad ? 48 : 32}&id=${user!.id}&mode=${geographicalMode}`
    );
    return response.data;
  };

  let i = 0;
  const fetchNewPost = async (excludeIds: number[]) => {
    i += 1;
    try {
      const excludeIdsParam = excludeIds.join(",");
      const response = await fetch(
        `/api/posts/getRandomPostsExcluding?number=${1}&id=${user!.id}&exclude_ids=${excludeIdsParam}&mode=${geographicalMode}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // Add position to the new post
      const newPostWithPosition = result.data.map((post: PostWithPosition) => ({
        ...post,
        position: {
          top: AlgorithmRandomPosition(false).top,
          left: AlgorithmRandomPosition(false).left,
        },
      }));

      console.log("new post id: ", newPostWithPosition[0], "trial", i);
      if (newPostWithPosition.length > 0) return newPostWithPosition[0];
    } catch (error) {
      setError("Failed to fetch new post.");
      console.error(error);
      return null;
    }
  };


  const getCountryFlag = (country: string) => {
    if (country) {
      switch (country) {
        case "Canada":
          return countries.canada;
        case "USA":
          return countries.usa;
        case "France":
          return countries.france;
        case "Italy":
          return countries.italy;
        case "China":
          return countries.china;
        case "Argentina":
          return countries.argentina;
        default:
          console.warn(`Country flag not found for: ${country}`);
          return countries.canada;
      }
    } else {
      console.warn(`Country flag not found for: ${country}`);
      return countries.canada;
    }
  };

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <SignedIn>
        <Header
          item={
            <View className="flex-row justify-between items-center px-11 pt-4  w-full mb-4">
              <Image
                source={require("@/assets/images/colore-word-logo.png")}
                style={{ width: 105, height: 45 }}
                className="shadow-sm"
                resizeMode="contain"
                accessibilityLabel="Colore logo"
              />
              <View className="flex flex-row p-1 items-center justify-center gap-4">
                <TouchableOpacity
                  onPress={() => {
                    //router.push("/root/chat/chat-screen");
                    setSelectedModal(() => <ChatScreen />);
                    setActiveModalTitle("Socials");
                  }}
                >
                  <Image
                    source={icons.addUser}
                    className="w-5 h-5"
                    style={{ tintColor: "#000" }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedModal(() => <NotificationScreen />);
                    setActiveModalTitle("Notifications");
                  }}
                >
                  <Image
                    source={icons.notification}
                    className="w-6 h-6 shadow-sm"
                    resizeMode="cover"
                  />
                  <View className="absolute right-2">
                    <NotificationBubble
                      unread={unreadComments + unreadPersonalPosts}
                      color={"#FF0000"}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedModal(() => (
                      <View className="flex-1 px-6"> 
                        <ItemContainer
                          label={"World"}
                          caption={"See notes from around the world!"}
                          icon={icons.globe}
                          colors={["#FBB1F5", "#ffe640"] as [string, string]}
                          actionIcon={
                            geographicalMode == "world" && icons.check
                          }
                          iconColor={"#22c722"}
                          onPress={() => {
                            setGeographicalMode("world");
                            setSelectedModal(null);
                            setActiveModalTitle("");
                          }}
                        />
                        <ItemContainer
                          label={`${userInfo?.country}`}
                          caption={`So... what is going on in ${userInfo?.country}?`}
                          icon={icons.globe}
                          colors={["#FBB1F5", "#ffe640"] as [string, string]}
                          actionIcon={
                            geographicalMode == "country" && icons.check
                          }
                          iconColor={"#22c722"}
                          onPress={() => {
                            setGeographicalMode("country");
                            setSelectedModal(null);
                            setActiveModalTitle("");
                          }}
                        />
                        <ItemContainer
                          label={`${userInfo?.state}`}
                          caption={`Living in ${userInfo?.state}!`}
                          icon={icons.globe}
                          colors={["#FBB1F5", "#ffe640"] as [string, string]}
                          actionIcon={
                            geographicalMode == "state" && icons.check
                          }
                          iconColor={"#22c722"}
                          onPress={() => {
                            setGeographicalMode("state");
                            setSelectedModal(null);
                            setActiveModalTitle("");
                          }}
                        />
                        <ItemContainer
                          label={`${userInfo?.city}`}
                          caption={`Everything that happens in ${userInfo?.city} stays there.`}
                          icon={icons.globe}
                          colors={["#FBB1F5", "#ffe640"] as [string, string]}
                          actionIcon={geographicalMode == "city" && icons.check}
                          iconColor={"#22c722"}
                          onPress={() => {
                            setGeographicalMode("city");
                            setSelectedModal(null);
                            setActiveModalTitle("");
                          }}
                        />
                      </View>
                    ));
                    setActiveModalTitle("Select a region");
                  }}
                >
                  <Image source={icons.planet} className="w-6 h-6" />
                </TouchableOpacity>
              </View>
            </View>
          }
        />
        <PostItBoard
          userId={user!.id}
          handlePostsRefresh={fetchPosts}
          handleNewPostFetch={fetchNewPost}
          allowStacking={true}
          mode={geographicalMode}
          randomPostion={true} 
          handleUpdatePin={() => {}}        />
        {/* <Action 
        friendName={""}
         action={action} 
         handleAction={() => {}}/>*/}
        {!!selectedModal && (
          <ModalSheet
            children={selectedModal}
            title={activeModalTitle}
            isVisible={!!selectedModal}
            onClose={() => {
              setSelectedModal(null);
              setActiveModalTitle("");
            }}
          />
        )}
      </SignedIn>
    </View>
  );
}
