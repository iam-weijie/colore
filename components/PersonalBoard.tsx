import { useGlobalContext } from "@/app/globalcontext";
import PostItBoard from "@/components/PostItBoard";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import Action from "./InfoScreen";
import { ActionType } from "@/lib/prompts";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

type PersonalBoardProps = {
    userId: string;
    boardId: number;
}
  const screenHeight = Dimensions.get("screen").height;
  const screenWidth = Dimensions.get("screen").width;


const PersonalBoard: React.FC<PersonalBoardProps> = ({ userId, boardId }) => {
  const { user } = useUser();
  const {isIpad} = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [username, setUsername] = useState<string>("");
  const [shouldRefresh, setShouldRefresh] = useState(0); // Add a refresh counter
  const isOwnBoard = !userId || userId === user?.id;
  const [maxPosts, setMaxPosts] = useState(0);
  const [postRefIDs, setPostRefIDS] = useState<number[]>([]);
  const [updatePinnedPosts, setUpdatePinnedPosts] = useState<boolean>(false);
  const [action, setAction] = useState(ActionType.NONE);
  const screenHeight = Dimensions.get('window').height;
  const [boardTilt, setBoardTilt] = useState({ x: 0, y: 0 });

  const fetchUserData = async () => {
    
      try {
        const response = await fetchAPI(`/api/users/getUserInfo?id=${userId}`, {
          method: 'GET'
        });

        setProfileUser(response.data[0]);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError("Failed to load profile");
      }
    
    setLoading(false);
  };



  const fetchPersonalPosts = async () => {

    if (updatePinnedPosts) {
      const existingPostIds = postRefIDs;
    
      try {
        const posts = await fetchAPI(`/api/posts/getPostsById?ids=${existingPostIds}`);

        const updatedPosts: Post[] = boardId == 0 ? posts.data : posts.data.filter((p: Post) => p.board_id == boardId);
    
       
        const formattedPosts = updatedPosts.map((post: Post) => ({
          ...post,
          recipient_user_id: post.recipient_user_id,
          pinned: post.pinned,
          like_count: post.like_count || 0,
          report_count: post.report_count || 0,
          unread_comments: post.unread_comments || 0
        }));
      
        setUpdatePinnedPosts(false)
        //getAction(formattedPosts)
        return formattedPosts
       
    
      } catch (error) {
        console.error("Failed to update posts: ", error);
      }
    }
    else {
      const viewerId = user!.id;
      const maxPostOnScreen = postRefIDs.length == 0 ? (isIpad ? 48 : 32) : Math.min(postRefIDs.length  + 14, (isIpad ? 24 : 18) )
      setMaxPosts(maxPostOnScreen); 
    
      try {
    
      let board;
      if (boardId > 0) {
       board = await fetchAPI(
        `/api/boards/getBoardById?id=${boardId}`
      );
    }
      let filteredPosts;
      let posts;
      
      console.log("board", board, boardId, userId)
     
      if (board) {
        posts = await fetchAPI(
          `/api/posts/getPostsByBoardId?id=${boardId}`
        );

        if (board.data.restrictions.includes("Everyone")) {
          console.log(
            "Ran1"
          )
        filteredPosts =  posts.data 
      } else {
        console.log(
          "Ran2"
        )
        filteredPosts = posts.data.filter((p: Post) => p.recipient_user_id == userId);
      }
        
    
      
      } else {
        console.log(
          "Ran3"
        )
         posts = await fetchAPI(
          `/api/posts/getPersonalPosts?number=${maxPostOnScreen}&recipient_id=${userId}&user_id=${viewerId}`
        );

        if (posts.data.length === 0) {
          return
        }
        filteredPosts = posts.data.filter((post: Post) => (
          isOwnBoard || (!isOwnBoard && post.clerk_id == user!.id) || (post.pinned)
        ));
      }
      
      
     
  
      const boardOnlyPosts = boardId == 0 ? filteredPosts : filteredPosts.filter((p: Post) => p.board_id == boardId);

      console.log("filtered Post", filteredPosts.length, boardOnlyPosts.length)
    
      // Validate and format each post
      const formattedPosts = boardOnlyPosts.map((post: Post) => ({
        ...post,
        recipient_user_id: post.recipient_user_id,
        pinned: post.pinned,
        like_count: post.like_count || 0,
        report_count: post.report_count || 0,
        unread_comments: post.unread_comments || 0
      }));
      
      //getAction(formattedPosts)
      return formattedPosts;
    } catch (error) {
      console.log("Failed to fetch posts", error)
    }
      
    }
   
  };


  const AlgorithmNewPosition = (isPinned: boolean) => {

    if (isPinned) {
      return {top: 60 + Math.random() * 10, left: 40 + Math.random() * 10 }
    } else if (isIpad) {
      const top = ((Math.random() - 0.5) * 2) * screenHeight / 3 + screenHeight / 4;
      const left = ((Math.random() - 0.5) * 2) * screenWidth / 3 + screenWidth - screenWidth / 1.75
      return {
        top:  top,
        left: left
      }
    }
     else {
      const top = ((Math.random() - 0.5) * 2) * screenHeight / 4 + screenHeight / 4;
      const left = ((Math.random() - 0.5) * 2) * screenWidth / 4 + screenWidth / 4
      return {
        top:  top,
        left: left
      }
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
      const filteredForBoard = result.data.filter((p) => p.board_id == boardId)
      const newPostWithPosition = filteredForBoard.map((post: Post) => ({
        ...post,
        position: {
          top:  AlgorithmNewPosition(post.pinned).top,
          left: AlgorithmNewPosition(post.pinned).left,
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
      setLoading(true);
      fetchUserData();
      fetchPersonalPosts();
      //setShouldRefresh((prev) => prev + 1); // Increment refresh counter
    }, [userId])
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
                <ColoreActivityIndicator text="Summoning Bob..." />
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

    // Parallax effect handler
    const handleParallax = (event) => {
      const { locationX, locationY } = event.nativeEvent;
      const centerX = event.nativeEvent.pageX / Dimensions.get('window').width;
      const centerY = event.nativeEvent.pageY / Dimensions.get('window').height;
      
      setBoardTilt({
        x: (centerX - 0.5) * 5, // -2.5° to +2.5° tilt
        y: (centerY - 0.5) * -3 // Reverse tilt for natural feel
      });
    };
  


  return (
    <View 
  className="flex-1 relative overflow-hidden" 
  style={{ height: screenHeight }}
  onTouchMove={handleParallax}
  onTouchEnd={() => setBoardTilt({ x: 0, y: 0 })}
>
  {/* Animated Gradient Background */}
  <MotiView
    from={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ type: 'timing', duration: 800 }}
    className="absolute inset-0"
  >
    <LinearGradient
      colors={['#fdf4ff', '#f0f9ff', '#f3e8ff']} // softer pink, blue, purple
      locations={[0, 0.5, 1]}
      style={{ flex: 1 }}
    />
  </MotiView>

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
      className="flex-1 mx-4 my-6 rounded-[48px] overflow-hidden"
    >
      <PostItBoard
        key={shouldRefresh}
        userId={userId}
        handlePostsRefresh={fetchPersonalPosts}
        handleNewPostFetch={fetchNewPersonalPost}
        handleUpdatePin={(ids) => updatePinPosts(ids)}
        allowStacking={true}
        showPostItText={true}
        invertColors={false}
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
      
          <InteractionButton 
          label={"Reply"}
          showLabel={false}
          icon={icons.pencil}
          color="#000"
          onPress={() => {
            router.push({
              pathname: "root/new-post",
              params: { recipient_id: userId, username: profileUser?.username, boardId }
            })
          }}
          />
       
      </View>
    </MotiView>


  </SignedIn>
</View>

  );
}



export default PersonalBoard;