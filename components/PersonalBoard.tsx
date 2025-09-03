import { useDevice } from "@/app/contexts/DeviceContext";
import PostItBoard from "@/components/PostItBoard";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import Action from "./InfoScreen";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Post, Board } from "@/types/type";
import UserProfile from "./UserProfile";
import { Dimensions } from "react-native";
import InteractionButton from "./InteractionButton";
import ColoreActivityIndicator from "./ColoreActivityIndicator";
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import React from "react";
import PostModal from "./PostModal";
import { usePersonalPosts } from "@/hooks/usePersonalBoard";

type PersonalBoardProps = {
    userId: string;
    boardId: number;
    restrictions?: {allowedComments: boolean};
    shuffleModeOn?: boolean;
    setShuffleModeOn?: (value: boolean) => void;
}
  const screenHeight = Dimensions.get("screen").height;
  const screenWidth = Dimensions.get("screen").width;


const PersonalBoard: React.FC<PersonalBoardProps> = ({ userId, boardId, restrictions, shuffleModeOn, setShuffleModeOn }) => {
  const { user } = useUser();
  const { isIpad } = useDevice();
  const [loading, setLoading] = useState(true);

  const [postRefIDs, setPostRefIDS] = useState<number[]>([]);
const [updatePinnedPosts, setUpdatePinnedPosts] = useState<boolean>(false);

const updatePinPosts = (existingIds: number[]) => {
  setUpdatePinnedPosts(true)
  setPostRefIDS(existingIds)
}

const handleUpdatePin = () => {
  setUpdatePinnedPosts(!updatePinnedPosts)
}

const isOwnBoard = !userId || userId == user?.id;
const { boardOnlyPosts, fetchPosts, maxPosts, isLoading, error } = usePersonalPosts({
  userId: userId,
  viewerId: user!.id,
  boardId: boardId,
  isIpad: isIpad,
  isOwnBoard: isOwnBoard,
  postRefIDs: postRefIDs,
  updatePinnedPosts
})

const handleFetchPosts = async () => {
  console.log("[PersonalBoard]: Starting fetchPosts...");
  try {
    const posts = await fetchPosts();
    console.log("[PersonalBoard]: Fetch completed, posts count:", posts?.length || 0);
    return posts;
  } catch (error) {
    console.error("[PersonalBoard]: Error fetching posts:", error);
    return [];
  }
}
  const handleShuffle = () => {
    if (shuffleModeOn) {
      const randomizePosts = boardOnlyPosts.sort(() => Math.random() - 0.5);
      return randomizePosts
    }
  }


  const fetchNewPersonalPost = async (excludeIds: number[]) => {
    try {
      const excludeIdsParam = excludeIds.join(',');
      const response = await fetch(
        `/api/posts/getPersonalPostsExcluding?number=${1}&user_id=${user!.id}&recipient_id=${userId}&exclude_ids=${excludeIdsParam}`
      );
      if (!response.ok) throw new Error("Network response was not ok 1");
      const result = await response.json();
      if (result.length == 0) {return}
      const filteredForBoard = result.data.filter((p: Post) => p.board_id == boardId);
      const newPostWithPosition = filteredForBoard;
      if (newPostWithPosition.length > 0) return newPostWithPosition[0];
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  
  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }



  return (
    <View 
  className="flex-1 relative overflow-hidden" 
  style={{ height: screenHeight }}
>

  <SignedIn>
    {/* Interactive Cork Board */}
    <MotiView
      from={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        damping: 10,
        mass: 0.5
      }}
      className="flex-1 "
    >
      <PostItBoard
        userId={userId}
        handlePostsRefresh={fetchPosts}
        handleNewPostFetch={fetchNewPersonalPost}
        handleUpdatePin={(ids) => updatePinPosts(ids)}
        allowStacking={true}
        showPostItText={true}
        invertColors={true}
        randomPostion={false}
        allowedComments={restrictions?.allowedComments ?? true}
      />
    </MotiView>

    <MotiView
      from={{ translateY: 100, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        damping: 10,
        mass: 0.8,
        delay: 300
      }}
      className="absolute bottom-6 self-center z-50"
      style={{
        shadowColor: '#f0f9ff',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 6,
      }}
    >
      
      <View
        className="mb-6"
      >
      
       
      </View>
    </MotiView>

      {shuffleModeOn && 
      <PostModal 
      isVisible={shuffleModeOn} 
      selectedPosts={handleShuffle() ?? []} 
      handleCloseModal={() => setShuffleModeOn && setShuffleModeOn(false)}
      allowedComments={restrictions?.allowedComments ?? true} />
      }
  </SignedIn>
</View>

  );
}



export default PersonalBoard;

