import PostItBoard from "@/components/PostItBoard";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Post } from "@/types/type";

type PersonalBoardProps = {
    userId: string;
}

const PersonalBoard: React.FC<PersonalBoardProps> = ({ userId }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [shouldRefresh, setShouldRefresh] = useState(0); // Add a refresh counter
  const isOwnBoard = !userId || userId === user?.id;
  const [maxPosts, setMaxPosts] = useState(0);
  const [postRefIDs, setPostRefIDS] = useState<number[]>([]);
  const [updatePinnedPosts, setUpdatePinnedPosts] = useState<boolean>(false);

  const fetchUserData = async () => {
    if (!isOwnBoard) {
      try {
        const response = await fetchAPI(`/api/users/getUserInfo?id=${userId}`);
        setProfileUser(response.data[0]);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError("Failed to load profile");
      }
    }
    setLoading(false);
  };



  const fetchPersonalPosts = async () => {

    if (updatePinnedPosts) {
      const existingPostIds = postRefIDs;
    
      try {
        const response = await fetchAPI(`/api/posts/getPostsById?ids=${existingPostIds}`);
        const updatedPosts: Post[] = response.data;
    
        const formattedPosts = updatedPosts.map((post: Post) => ({
          ...post,
          recipient_user_id: post.recipient_user_id,
          pinned: post.pinned,
          like_count: post.like_count || 0,
          report_count: post.report_count || 0,
          unread_comments: post.unread_comments || 0
        }));
      
        setUpdatePinnedPosts(false)
        return formattedPosts
       
    
      } catch (error) {
        console.error("Failed to update posts: ", error);
      }
    }
    else {
      const viewerId = user!.id;
      const maxPostOnScreen = postRefIDs.length == 0 ? 4 : Math.min(postRefIDs.length  + 4, 8)
      setMaxPosts(maxPostOnScreen ); 
    
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?number=${maxPostOnScreen}&recipient_id=${userId}&user_id=${viewerId}`
      );
  
      const filteredPosts = response.data.filter((post: Post) => (
        isOwnBoard || (!isOwnBoard && post.clerk_id == user!.id) || (post.pinned)
      ));
  
          
      // Validate and format each post
      const formattedPosts = filteredPosts.map((post: Post) => ({
        ...post,
        recipient_user_id: post.recipient_user_id,
        pinned: post.pinned,
        like_count: post.like_count || 0,
        report_count: post.report_count || 0,
        unread_comments: post.unread_comments || 0
      }));
      return formattedPosts;
      
    }
   
  };

  const fetchNewPersonalPost = async (excludeIds: number[]) => {
    try {
      const excludeIdsParam = excludeIds.join(',');
      const response = await fetch(
        `/api/posts/getPersonalPostsExcluding?number=${1}&user_id=${user!.id}&recipient_id=${userId}&exclude_ids=${excludeIdsParam}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      const newPostWithPosition = result.data.map((post: Post) => ({
        ...post,
        position: {
          top: post.pinned ? 150 : Math.random() * 775 / 2,
          left: post.pinned ? 100 : Math.random() * 475 / 2,
        },
      }));
      if (newPostWithPosition.length > 0) return newPostWithPosition[0];
    } catch (error) {
      setError("Failed to fetch new post.");
      console.error(error);
      return null;
    }
  };

  const updatePinPosts = (existingIds: number[]) => {
    setUpdatePinnedPosts(true)
    setPostRefIDS(existingIds)
    fetchPersonalPosts()
    setShouldRefresh((prev) => prev + 1);
  }

  

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchPersonalPosts;
      setShouldRefresh((prev) => prev + 1); // Increment refresh counter
    }, [userId])
  );

  if (loading) {
    return (
      <View className="flex-[0.8] justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <SignedIn>
        <PostItBoard 
          key={shouldRefresh} // Add key to force re-render when shouldRefresh changes
          userId={userId}
          handlePostsRefresh={fetchPersonalPosts}
          handleNewPostFetch={fetchNewPersonalPost}
          handleUpdatePin={(ids) => updatePinPosts(ids)}
          allowStacking={true}
          showPostItText={true}
          invertColors={true}
        />
      </SignedIn>
    </View>
  );
}

export default PersonalBoard;