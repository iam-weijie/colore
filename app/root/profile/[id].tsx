// app/(profile)/Profile.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

import UserProfile from "@/components/UserProfile";
import { CustomButtonBar } from "@/components/CustomTabBar";
import ModalSheet from "@/components/Modal";
import ItemContainer from "@/components/ItemContainer";
import PostModal from "@/components/PostModal";
import NicknameView from "./nickname";

import { useAlert } from "@/notifications/AlertContext";
import { useUserDataContext } from "@/app/contexts/UserDataContext";

import { fetchAPI } from "@/lib/fetch";
import { cancelFriendRequest, fetchFriendStatus, unfriend } from "@/lib/friend";
import { icons } from "@/constants";
import { FriendStatus } from "@/lib/enum";
import type { FriendStatusType, Post } from "@/types/type";
import * as Linking from "expo-linking";

const Profile = React.memo(() => {
  const { user } = useUser();
  const { getNicknameFor, refreshUserData } = useUserDataContext();
  const { showAlert } = useAlert();

  // ---- Params ----
  const params = useLocalSearchParams();
  const userId = typeof params.id === "string" ? params.id : "";
  const username = typeof params.username === "string" ? params.username : "";
  const postId = typeof params.postId === "string" ? params.postId : "";
  const commentId = typeof params.commentId === "string" ? params.commentId : "";
  const tab = typeof params.tab === "string" ? params.tab : "";

  // ---- State ----
  const [post, setPost] = useState<Post | undefined>(undefined);
  const [friendStatus, setFriendStatus] = useState<FriendStatusType>(FriendStatus.UNKNOWN);
  const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
  const [isUserSettingsVisible, setIsUserSettingsVisible] = useState(false);
  const [selectedTabSetting, setSelectedTabSetting] = useState<string>("");

  // ---- Derived ----
  const nickname = useMemo(() => {
    if (!userId) return "";
    return getNicknameFor(userId);
  }, [getNicknameFor, userId]);

  // ---- Fetchers ----
  const fetchPost = useCallback(async (id: string) => {
    try {
      const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`);
      const data = response?.data?.[0];
      if (data) setPost(data);
    } catch (error) {
      console.log("[Profile] Failed to fetch post: ", error);
    }
  }, []);

  const getFriendStatus = useCallback(async () => {
    if (!user?.id || !userId || user.id === userId) return;
    const status = await fetchFriendStatus(userId, user);
    setFriendStatus(status);
  }, [user, userId]);

  // ---- Friend actions ----
  const handleUnfriend = useCallback(async () => {
    if (!user?.id || !userId) return;
    setIsHandlingFriendRequest(true);
    try {
      const response = await unfriend(user.id, userId);
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
          message: "Error unfriending this user.",
          type: "ERROR",
          status: "error",
        });
      }
      setFriendStatus(response);
    } catch (error) {
      console.error("Error unfriending user:", error);
      showAlert({
        title: "Error",
        message: "An unexpected error occurred.",
        type: "ERROR",
        status: "error",
      });
    } finally {
      setIsHandlingFriendRequest(false);
    }
  }, [user, userId, showAlert]);

  const handleSendFriendRequest = useCallback(async () => {
    if (!user?.id || !userId) return;
    setIsHandlingFriendRequest(true);
    try {
      await fetchAPI(`/api/friends/newFriendRequest`, {
        method: "POST",
        body: JSON.stringify({ clerkId: user.id, friendId: userId }),
      });
      showAlert({
        title: "Friend request sent!",
        message: "You have sent a friend request to this user.",
        type: "FRIEND_REQUEST",
        status: "success",
      });
      setFriendStatus(FriendStatus.SENT);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      showAlert({
        title: "Error",
        message: "Error sending friend request.",
        type: "ERROR",
        status: "error",
      });
    } finally {
      setIsHandlingFriendRequest(false);
    }
  }, [user, userId, showAlert]);

  const handleCancelFriendRequest = useCallback(async () => {
    if (!user?.id || !userId) return;
    setIsHandlingFriendRequest(true);
    try {
      const response = await cancelFriendRequest(user.id, userId);
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
          message: "Error cancelling this friend request.",
          type: "ERROR",
          status: "error",
        });
      }
      setFriendStatus(response); // rely purely on enum
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      showAlert({
        title: "Error",
        message: "An unexpected error occurred.",
        type: "ERROR",
        status: "error",
      });
    } finally {
      setIsHandlingFriendRequest(false);
    }
  }, [user, userId, showAlert]);

  // ---- Misc handlers ----
  const handleReportPress = useCallback(() => {
    Linking.openURL("mailto:support@colore.ca");
  }, []);

  const handleCloseUserSettings = useCallback(() => {
    setIsUserSettingsVisible(false);
    setSelectedTabSetting("");
  }, []);

  const handleAddNickname = useCallback(() => {
    setSelectedTabSetting("nickname");
  }, []);

  const handleNewPost = useCallback(() => {
    router.push({
      pathname: "root/new-post",
      params: { 
        recipientId: userId, 
        username,
         }, // align with other screen
    });
  }, [userId, username]);

  const handleGoBack = useCallback(() => router.back(), []);

  const handleOpenSettings = useCallback(() => {
    setIsUserSettingsVisible(true);
  }, []);

  // ---- Effects ----
  useEffect(() => {
    refreshUserData();
    getFriendStatus();
    if (postId) fetchPost(postId);
  }, [refreshUserData, getFriendStatus, fetchPost, postId]);

  // ---- Bottom controls ----
  const navigationControls = useMemo(
    () => [
      { icon: icons.back, label: "Back", onPress: handleGoBack },
      { icon: icons.pencil, label: "New Post", onPress: handleNewPost, isCenter: true },
      { icon: icons.settings, label: "Settings", onPress: handleOpenSettings },
    ],
    [handleGoBack, handleNewPost, handleOpenSettings]
  );

  // ---- Settings modal ----
  const UserSettings = useMemo(() => {
    const options: Array<{
      label: string;
      onPress: () => void;
      icon: any;
      disabled?: boolean;
    }> = [];

    if (userId !== user?.id) {
      if (friendStatus === FriendStatus.NONE) {
        options.push({
          label: "Add Friend",
          onPress: handleSendFriendRequest,
          icon: icons.addUser,
          disabled: isHandlingFriendRequest,
        });
      } else if (friendStatus === FriendStatus.SENT) {
        options.push({
          label: "Cancel Friend Request",
          onPress: handleCancelFriendRequest,
          icon: icons.close,
          disabled: isHandlingFriendRequest,
        });
      } else if (friendStatus === FriendStatus.FRIENDS) {
        options.push({
          label: "Unfriend",
          onPress: handleUnfriend,
          icon: icons.removeUser,
          disabled: isHandlingFriendRequest,
        });
        options.push({
          label: "Add Nickname",
          icon: icons.add,
          onPress: handleAddNickname,
        });
      }

      options.push({
        label: "Report",
        icon: icons.email,
        onPress: handleReportPress,
      });
    }

    return (
      <ModalSheet isVisible={isUserSettingsVisible} onClose={handleCloseUserSettings} title="Settings">
        <View className="flex flex-col w-full items-center justify-center py-4 px-6 gap-y-4">
          {selectedTabSetting === "nickname" ? (
            <View className="flex-1 w-full h-full">
              <NicknameView onUpdate={() => setSelectedTabSetting("")} />
            </View>
          ) : (
            options.map((option, index) => (
              <ItemContainer
                key={index}
                label={option.label}
                caption={option.disabled ? "Processing..." : ""}
                icon={option.icon}
                colors={["#93c5fd", "#b8e1ff"]}
                iconColor="#000"
                onPress={option.onPress}
              />
            ))
          )}
        </View>
      </ModalSheet>
    );
  }, [
    userId,
    user,
    friendStatus,
    isHandlingFriendRequest,
    isUserSettingsVisible,
    handleSendFriendRequest,
    handleCancelFriendRequest,
    handleUnfriend,
    handleAddNickname,
    handleReportPress,
    handleCloseUserSettings,
    selectedTabSetting,
  ]);


  // --- Make Sure there is a User Id ----

  if (!userId) {
    router.back()
    showAlert({
      title: "Error",
      message: "We could not find this user.",
      type: "ERROR",
      status: "error"
    })
  }
  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <UserProfile userId={userId} friendStatus={friendStatus} nickname={nickname} tab={tab} />

      {user?.id && userId && user.id !== userId ? (
        <CustomButtonBar buttons={navigationControls} />
      ) : null}

      {UserSettings}

      {post && (
        <PostModal
          isVisible={!!post}
          selectedPosts={[post]}
          handleCloseModal={() => setPost(undefined)}
          seeComments={!!commentId}
        />
      )}
    </View>
  );
});

export default Profile;
