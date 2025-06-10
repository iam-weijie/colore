import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import UserProfile from "@/components/UserProfile";
import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { View, TouchableOpacity, Image, Text } from "react-native";
import DropdownMenu from "@/components/DropdownMenu";
import { icons } from "@/constants";
import { FriendStatus } from "@/lib/enum";
import { FriendStatusType, UserNicknamePair } from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import * as Linking from "expo-linking";
import { cancelFriendRequest, fetchFriendStatus, unfriend } from "@/lib/friend";
import { CustomButtonBar } from "@/components/CustomTabBar";
import ModalSheet from "@/components/Modal";
import { set } from "date-fns";
import ItemContainer from "@/components/ItemContainer";
import { useGlobalContext } from "@/app/globalcontext";

const Profile = () => {
  const { user } = useUser();
  const { resetDraftPost } = useGlobalContext();
  const { userId, username } = useLocalSearchParams();
  const [isUserSettingsVisible, setIsUserSettingsVisible] = useState(false);
  const [nickname, setNickname] = useState("");
  const [friendStatus, setFriendStatus] = useState<FriendStatusType>(
    FriendStatus.UNKNOWN
  );
  const { showAlert } = useAlert();
  const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();

  const getFriendStatus = async () => {
    let status;
    if (user!.id !== userId) {
      status = await fetchFriendStatus(userId as string, user!);
      //console.log("Friend status:", status.name);
      setFriendStatus(status);
    }
  };

  const handleAddNickname = () => {
    setStateVars({
      ...stateVars,
      previousScreen: "profile",
      userId: userId as string,
    });
    router.push("/root/profile/nickname");
  };

  const findUserNickname = (userArray: UserNicknamePair[], userId: string) => {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  };
  const fetchCurrentNickname = async () => {
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        //Fetch User Color Collected
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const nicknames = response.data[0].nicknames || [];
      return findUserNickname(nicknames, userId) === -1
        ? ""
        : nicknames[findUserNickname(nicknames, userId)][1];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const handleUnfriend = async () => {
    setIsHandlingFriendRequest(true);
    const response: FriendStatusType = await unfriend(
      user!.id,
      userId as string
    );
    if (response === FriendStatus.NONE) {
      showAlert({
        title: "Unfriended",
        message: "You have unfriended this user.",
        type: "FRIEND_REQUEST",
        status: "success",
      });
    } else {
      showAlert({
        title: "Error",
        message: `Error unfriending this user.`,
        type: "ERROR",
        status: "error",
      });
    }
    setFriendStatus(response);
    setIsHandlingFriendRequest(false);
  };

  const handleSendFriendRequest = async () => {
    try {
      setIsHandlingFriendRequest(true);
      await fetchAPI(`/api/friends/newFriendRequest`, {
        method: "POST",
        body: JSON.stringify({
          clerkId: user!.id,
          friendId: userId,
        }),
      });
      showAlert({
        title: "Friend request sent!",
        message: "You have sent a friend request to this user.",
        type: "FRIEND_REQUEST",
        status: "success",
      });
      setFriendStatus(FriendStatus.SENT);
      setIsHandlingFriendRequest(false);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      showAlert({
        title: "Error",
        message: `Error sending friend request.`,
        type: "ERROR",
        status: "error",
      });
    }
  };

  const handleCancelFriendRequest = async () => {
    setIsHandlingFriendRequest(true);
    const response: FriendStatusType = await cancelFriendRequest(
      user!.id,
      userId
    );
    if (response === FriendStatus.NONE) {
      showAlert({
        title: "Cancelled",
        message: "Friend request cancelled.",
        type: "UPDATE",
        status: "success",
      });
    } else {
      showAlert({
        title: "Error",
        message: `Error cancelling this friend request.`,
        type: "ERROR",
        status: "error",
      });
    }
    console.log("Friend status after cancel:", response);
    const status = response.name == "none" ? FriendStatus.NONE : response;
    setFriendStatus(status);
    setIsHandlingFriendRequest(false);
  };

  const handleReportPress = () => {
    Linking.openURL("mailto:support@colore.ca");
  };

  useEffect(() => {
    const getNickname = async () => {
      const nickname = await fetchCurrentNickname();
      if (nickname) {
        setNickname(nickname);
      }
    };
    getNickname();
    getFriendStatus();
  }, []);

  const navigationControls =
    userId !== user?.id
      ? [
          {
            icon: icons.back,
            label: "Back",
            onPress: () => router.back(),
          },
          {
            icon: icons.pencil,
            label: "New Post",
            onPress: () => {
              resetDraftPost();
              router.push({
                pathname: "root/new-post",
                params: {
                  recipientId: userId,
                  username: username,
                },
              });
            },
            isCenter: true,
          },
          {
            icon: icons.settings,
            label: "More",
            onPress: () => setIsUserSettingsVisible(true),
            isCenter: true,
          },
        ]
      : [];

  const [userSettingTab, setUserSettingTab] = useState<string>("");
  const UserSettings = () => {
    return (
      <ModalSheet
        title={"Settings"}
        isVisible={isUserSettingsVisible}
        onClose={() => {
          setIsUserSettingsVisible(false);
        }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <ItemContainer
            label={nickname ? nickname : "Set a nickname"}
            caption={
              nickname ? `Change ${nickname}'s nickname` : "Nickname me!"
            }
            icon={icons.addUser}
            colors={["#93c5fd", "#b8e1ff"]}
            iconColor="#000"
            onPress={() => {
              handleAddNickname();
            }}
            actionIcon={nickname && icons.check}
          />
          {friendStatus == FriendStatus.FRIENDS && (
            <ItemContainer
              label={"Unfriend"}
              caption={"Add recipient to this post"}
              icon={icons.trash}
              colors={["#93c5fd", "#b8e1ff"]}
              iconColor="#000"
              onPress={() => handleUnfriend()}
            />
          )}
          {friendStatus == FriendStatus.SENT && (
            <ItemContainer
              label={"Cancel friend request"}
              caption={"Cancel the friend request you sent to this user"}
              icon={icons.trash}
              colors={["#93c5fd", "#b8e1ff"]}
              iconColor="#000"
              onPress={() => handleCancelFriendRequest()}
            />
          )}
          {friendStatus == FriendStatus.NONE && (
            <ItemContainer
              label={"Send a friend request"}
              caption={"Begin a legendary friendship with this user"}
              icon={icons.addUser}
              colors={["#93c5fd", "#b8e1ff"]}
              iconColor="#000"
              onPress={() => handleSendFriendRequest()}
            />
          )}
          <ItemContainer
            label={"Report user"}
            caption={"Report this user to the support team"}
            icon={icons.email}
            colors={["#93c5fd", "#b8e1ff"]}
            iconColor="#000"
            onPress={() => handleReportPress()}
          />
        </View>
      </ModalSheet>
    );
  };

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      {userId && (
        <UserProfile
          userId={userId as string}
          friendStatus={FriendStatus.UNKNOWN}
          nickname={nickname}
        />
      )}
      <UserSettings />
      <CustomButtonBar buttons={navigationControls} />
    </View>
  );
};

export default Profile;
