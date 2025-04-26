import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import UserProfile from "@/components/UserProfile";
import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { View, TouchableOpacity, Image } from "react-native";
import DropdownMenu from "@/components/DropdownMenu";
import { icons } from "@/constants";
import { FriendStatus } from "@/lib/enum";
import {
  FriendStatusType,
} from "@/types/type";
import { useAlert } from '@/notifications/AlertContext';
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import * as Linking from "expo-linking";
import {
  fetchFriendStatus,
  unfriend,
} from "@/lib/friend";
import { CustomButtonBar } from "@/components/CustomTabBar";


const Profile = () => {
  const { user } = useUser();
  const { id } = useLocalSearchParams();
  const [friendStatus, setFriendStatus] = useState<FriendStatusType>(
      FriendStatus.UNKNOWN
    );
  const { showAlert } = useAlert();
  const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
  const { stateVars, setStateVars } = useNavigationContext();



  const handleAddNickname = () => {
        setStateVars({
          ...stateVars,
          previousScreen: "profile",
          id,
        });
        router.push("/root/profile/nickname");
      };
    
    
    
    
      const handleSendFriendRequest = async () => {
        try {
          setIsHandlingFriendRequest(true);
          await fetchAPI(`/api/friends/newFriendRequest`, {
            method: "POST",
            body: JSON.stringify({
              clerkId: user!.id,
              friendId: id,
            }),
          });
          showAlert({
            title: 'Friend request sent!',
            message: "You have sent a friend request to this user.",
            type: 'FRIEND_REQUEST',
            status: 'success',
          });
          setFriendStatus(FriendStatus.SENT);
          setIsHandlingFriendRequest(false);
        } catch (error) {
          console.error("Failed to send friend request:", error);
          showAlert({
            title: 'Error',
            message: `Error sending friend request.`,
            type: 'ERROR',
            status: 'error',
          });
        }
      };
    
      const handleReportPress = () => {
        Linking.openURL("mailto:support@colore.ca");
      };
    
    
      // to prevent database errors,
      // don't load the "send friend request"
      // option if the friend status can't be determined
      const menuItems_unloaded = [
        { label: "Nickname", source: icons.person, color: "#000000", onPress: handleAddNickname },
        { label: "Report", source: icons.email, color: "#DA0808", onPress: handleReportPress },
      ];
    
      const menuItems_default = [
        { label: "Nickname", source: icons.person, color: "#000000", onPress: handleAddNickname },
        { label: "Report",  source: icons.email, color: "#DA0808", onPress: handleReportPress },
      ];
    
      const menuItems_friend = [
        { label: "Nickname", source: icons.person, color: "#000000", onPress: handleAddNickname },
        { label: "Unfriend",  source: icons.close, color: "#6408DA", onPress: async () => {
          setIsHandlingFriendRequest(true);
          const response: FriendStatusType = await unfriend(
            user!.id,
            id as string
          );
          if (response === FriendStatus.NONE) {
            showAlert({
              title: 'Unfriended',
              message: "You have unfriended this user.",
              type: 'FRIEND_REQUEST',
              status: 'success',
            });
          } else {
            showAlert({
              title: 'Error',
              message: `Error unfriending this user.`,
              type: 'ERROR',
              status: 'error',
            });
          }
          setFriendStatus(response);
          setIsHandlingFriendRequest(false);
        }},
        { label: "Report",  source: icons.email, color: "#DA0808", onPress: handleReportPress },
      ];
    
      const menuItems_sent = [
        { label: "Nickname", source: icons.person, color: "#000000", onPress: handleAddNickname },
        {
          label: "Report",
          source: icons.email,
          color: "#DA0808",
          onPress: handleReportPress,
        },
      ];
    
      const menuItems_received = [
        { label: "Nickname", color: "#000000", source: icons.person, onPress: handleAddNickname },
        {
          label: "Report",
          color: "#DA0808",
          source: icons.email,
          onPress: () => handleReportPress,
        },
      ];

  const getMenu = (status: FriendStatusType) => {
    let menu;
    switch (status) {
      case FriendStatus.FRIENDS:
        return menu = menuItems_friend
      case FriendStatus.SENT:
        return menu = menuItems_sent
      case FriendStatus.RECEIVED:
        return menu = menuItems_received
      case FriendStatus.NONE:
        return menu = menuItems_default
      case FriendStatus.UNKNOWN:
        return menu = menuItems_unloaded
    }
  
    return menu
  }

  useEffect(() => {
      const getFriendStatus = async () => {
        let status;
        if (user!.id !== id) {
          status = await fetchFriendStatus(id as string, user!);
          //console.log("Friend status:", status.name);
          setFriendStatus(status);
        }
      };
      getFriendStatus();
    }, []);

     const navigationControls = id !== user?.id ? [
        {
          icon: icons.back,
          label: "Back",
          onPress: () => router.back(),
        },
        {
          icon: icons.pencil,
          label: "New Post",
          onPress: () => {},
          isCenter: true,
        },
        {
          icon: icons.settings,
          label: "More",
          onPress: () => {},
          isCenter: true,
        },
      ] : []
  return (
    <View className="flex-1 bg-[#FAFAFA]">
      {id && <UserProfile userId={id as string} friendStatus={FriendStatus.UNKNOWN}/>}

      {/*<View className="absolute w-full flex-row items-center justify-between bottom-12  px-8 ">
      <TouchableOpacity onPress={() => router.back()} className="p-4 rounded-full bg-white shadow-md ">
          <AntDesign name="caretleft" size={18} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}
          
        } className="p-4 rounded-full bg-white shadow-md ">
          <DropdownMenu
            menuItems={getMenu(friendStatus) ?? menuItems_unloaded} />
        </TouchableOpacity>
      </View>*/}

        <CustomButtonBar
              buttons={navigationControls}
              />
    </View>
  );
};

export default Profile;
