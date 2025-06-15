import React, { useState, useEffect, useCallback, useMemo } from "react";
import { router } from "expo-router";
import UserProfile from "@/components/UserProfile";
import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { View, TouchableOpacity, Image, Text } from "react-native";
import DropdownMenu from "@/components/DropdownMenu";
import { icons } from "@/constants";
import { FriendStatus } from "@/lib/enum";
import {
  FriendStatusType,
  Post,
  UserNicknamePair,
} from "@/types/type";
import { useAlert } from '@/notifications/AlertContext';
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import * as Linking from "expo-linking";
import { cancelFriendRequest, fetchFriendStatus, unfriend } from "@/lib/friend";
import { CustomButtonBar } from "@/components/CustomTabBar";
import ModalSheet from "@/components/Modal";
import { set } from "date-fns";
import ItemContainer from "@/components/ItemContainer";
import { useDraftPost } from "@/app/contexts/DraftPostContext";
import PostModal from "@/components/PostModal";
import { useUserDataContext } from "@/app/contexts/UserDataContext";

const Profile = React.memo(() => {
  const { user } = useUser();
  const [post, setPost] = useState<Post>();
  const { resetDraftPost } = useDraftPost();
  const params = useLocalSearchParams();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const username = typeof params.username === 'string' ? params.username : '';
  const postId = typeof params.postId === 'string' ? params.postId : '';
  const commentId = typeof params.commentId === 'string' ? params.commentId : '';
  const tab = typeof params.tab === 'string' ? params.tab : '';
  
  const [isUserSettingsVisible, setIsUserSettingsVisible] = useState(false);
  const { getNicknameFor, refreshUserData } = useUserDataContext();
  const [friendStatus, setFriendStatus] = useState<FriendStatusType>(
    FriendStatus.UNKNOWN
  );
  const { showAlert } = useAlert();
  const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();

  console.log("[Profile] arg: ", userId, username, postId, commentId, tab )

  const fetchPost = useCallback(async (id: string) => {
    try {
      const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`);
      const data = response.data[0];
      setPost(data);
    } catch (error) {
      console.log("[Notifications] Failed to fetch post: ", error);
    }
  }, []);

  const getFriendStatus = useCallback(async () => {
    if (!user?.id || !userId || user.id === userId) return;
    
    const status = await fetchFriendStatus(userId, user);
    setFriendStatus(status);
  }, [user, userId]);

  const handleAddNickname = useCallback(() => {
    setStateVars({
      ...stateVars,
      previousScreen: "profile",
      userId: userId,
    });
    router.push("/root/profile/nickname");
  }, [stateVars, userId, setStateVars]);

  const nickname = useMemo(() => {
    if (!userId) return "";
    return getNicknameFor(userId);
  }, [getNicknameFor, userId]);

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
          message: `Error unfriending this user.`,
          type: "ERROR",
          status: "error",
        });
      }
      
      setFriendStatus(response);
    } catch (error) {
      console.error("Error unfriending user:", error);
      showAlert({
        title: "Error",
        message: `An unexpected error occurred.`,
        type: "ERROR",
        status: "error",
      });
    } finally {
      setIsHandlingFriendRequest(false);
    }
  }, [user, userId, showAlert]);

  const handleSendFriendRequest = useCallback(async () => {
    if (!user?.id || !userId) return;
    
    try {
      setIsHandlingFriendRequest(true);
      
      await fetchAPI(`/api/friends/newFriendRequest`, {
        method: "POST",
        body: JSON.stringify({
          clerkId: user.id,
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
    } catch (error) {
      console.error("Failed to send friend request:", error);
      showAlert({
        title: "Error",
        message: `Error sending friend request.`,
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
          message: `Error cancelling this friend request.`,
          type: "ERROR",
          status: "error",
        });
      }
      
      const status = response.name === "none" ? FriendStatus.NONE : response;
      setFriendStatus(status);
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      showAlert({
        title: "Error",
        message: `An unexpected error occurred.`,
        type: "ERROR",
        status: "error",
      });
    } finally {
      setIsHandlingFriendRequest(false);
    }
  }, [user, userId, showAlert]);

  const handleReportPress = useCallback(() => {
    Linking.openURL("mailto:support@colore.ca");
  }, []);

  const handleCloseUserSettings = useCallback(() => {
    setIsUserSettingsVisible(false);
  }, []);

  const handleOpenUserSettings = useCallback(() => {
    setIsUserSettingsVisible(true);
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const handleGoToChat = useCallback(() => {
    router.push({
      pathname: "/root/chat/conversation",
      params: {
        clerkId: userId,
        username: username,
      },
    });
  }, [userId, username]);

  useEffect(() => {
    refreshUserData();
    getFriendStatus();
    
    if (postId) {
      fetchPost(postId);
    }
  }, [getFriendStatus, fetchPost, postId, refreshUserData]);

  const navigationControls = useMemo(() => {
    if (userId !== user?.id) {
      return [
        {
          icon: icons.back,
          label: "Back",
          onPress: handleGoBack,
        },
        {
          icon: icons.user,
          label: "Friend",
          onPress: handleOpenUserSettings,
          isCenter: true,
        },
        {
          icon: icons.chat,
          label: "Message",
          onPress: handleGoToChat,
        },
      ];
    } else {
      return [
        {
          icon: icons.back,
          label: "Back",
          onPress: handleGoBack,
        },
        {
          icon: icons.user,
          label: "User",
          onPress: handleOpenUserSettings,
          isCenter: true,
        },
        {
          icon: icons.chat,
          label: "Message",
          onPress: handleGoToChat,
        },
      ];
    }
  }, [userId, user, handleGoBack, handleOpenUserSettings, handleGoToChat]);

  const UserSettings = useMemo(() => {
    const options = [];

    if (userId !== user?.id) {
      if (friendStatus === FriendStatus.NONE) {
        options.push({
          label: "Add Friend",
          onPress: handleSendFriendRequest,
          disabled: isHandlingFriendRequest,
        });
      } else if (friendStatus === FriendStatus.SENT) {
        options.push({
          label: "Cancel Friend Request",
          onPress: handleCancelFriendRequest,
          disabled: isHandlingFriendRequest,
        });
      } else if (friendStatus === FriendStatus.FRIENDS) {
        options.push({
          label: "Unfriend",
          onPress: handleUnfriend,
          disabled: isHandlingFriendRequest,
        });
        options.push({
          label: "Add Nickname",
          onPress: handleAddNickname,
        });
      }

      options.push({
        label: "Report",
        onPress: handleReportPress,
      });
    }

    return (
      <ModalSheet
        isVisible={isUserSettingsVisible}
        onClose={handleCloseUserSettings}
        title={`${username || "User"} ${nickname ? `(${nickname})` : ""}`}
      >
        <View className="flex flex-col w-full items-center justify-center p-4 gap-y-3">
          {options.map((option, index) => (
            <ItemContainer
              key={index}
              label={option.label}
              caption={option.disabled ? "Processing..." : ""}
              icon={icons.user}
              colors={["#93c5fd", "#b8e1ff"]}
              iconColor="#000"
              onPress={option.onPress}
            />
          ))}
        </View>
      </ModalSheet>
    );
  }, [
    userId, 
    user, 
    friendStatus, 
    isHandlingFriendRequest, 
    isUserSettingsVisible, 
    username, 
    nickname, 
    handleSendFriendRequest, 
    handleCancelFriendRequest, 
    handleUnfriend, 
    handleAddNickname, 
    handleReportPress, 
    handleCloseUserSettings
  ]);

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <CustomButtonBar buttons={navigationControls} />
      <UserProfile
        userId={userId}
        friendStatus={friendStatus}
        nickname={nickname}
        tab={tab}
      />
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
