import { SafeAreaView, View, TouchableOpacity, Text, Image } from "react-native";
import PersonalBoard from "@/components/PersonalBoard";
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { icons } from "@/constants";
import { router } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import React, {useEffect, useState} from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from "@/notifications/AlertContext";
import { useUser } from "@clerk/clerk-expo";
import Header from "@/components/Header";
import { CustomButtonBar } from "@/components/CustomTabBar";
import Animated, { SlideInDown, SlideInUp, FadeInDown, FadeIn } from "react-native-reanimated";
import { Post } from "@/types/type";
import PostModal from "@/components/PostModal";

const UserPersonalBoard = () => {
  const { user } = useUser();
  const { id, username, boardId, postId } = useLocalSearchParams();
  const [boardInfo, setBoardInfo] = useState<any>();
  const [post, setPost] = useState<Post>();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const isOwnBoard = !id || id == user?.id;
  const [postCount, setPostCount] = useState<number>(0);
  const [joinedCommunity, setJoinedCommunity] = useState<boolean>(false);
  const [canParticipate, setCanParticipate] = useState<boolean>(false);
  const { showAlert } = useAlert();
  const handleNewPost = () => { 
    router.push({
      pathname: "/root/new-post",
      params: { 
        recipient_id: id,
        username: username,
        source: 'board'
      }
    });
  };

  const fetchPosts = async (id: string[]) => {
        try {
          const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`);
          const post = response.data;
    
          if (!post || post.length === 0) {
            return null;
          }
          setPost(post);
          setIsModalVisible(true);
        } catch (error) {
          return null;
        }
      };

  const fetchBoard = async () => {
    if (boardId == "-1" || username == "Personal Board") return;
    try {
      const response = await fetchAPI(`/api/boards/getBoardById?id=${boardId}`)

      const isPrivate = response.data.board_type == "personal"
      setBoardInfo(response.data)
      setCanParticipate(!isPrivate)
      setPostCount(response.count)

      const hasJoined = response.data.members_id.includes(user!.id)
      setJoinedCommunity(hasJoined)

      console.log("this board 3", response)
    } catch (error) {
      console.error("Failed to fetch board", error)
    }
  }

  const joinCommunity = async () => {
    const response = await fetchAPI(`/api/boards/handleJoiningCommunityBoard`, {
                  method: "PATCH",
                  body: JSON.stringify({ 
                    clerkId: user!.id,
                    boardId: boardId,
                    isJoining: !joinedCommunity }),
                })
    
                if (response.data[0].user_id != user!.id) {
                  if (!joinedCommunity) {
                  setJoinedCommunity(true)

                  showAlert({
                    title: 'Success',
                    message: `You've joined the community.`,
                    type: 'SUCCESS',
                    status: 'success',
                  });

                  } else {
                    setJoinedCommunity(false)
                  }
                } 
                
                if (!response.success) {
                  showAlert({
                    title: 'Error',
                    message: `You cannot leave a community you created.`,
                    type: 'ERROR',
                    status: 'error',
                  });
                }
  }

  const navigationUserControls = [
    {
      icon: icons.back,
      label: "Back",
      onPress: () => router.back(),
    },
    {
      icon: icons.search,
      label: "Search",
      onPress: () => {},
    },
    {
      icon: icons.pencil,
      label: "New Post",
      onPress: handleNewPost,
      isCenter: true,
    },
    {
      icon: icons.addUser,
      label: "Add friend",
      onPress: () => {},
    },
    {
      icon: joinedCommunity ? icons.close : icons.check,
      label: joinedCommunity ? "Leave" : "Join",
      onPress: joinCommunity,
    },
  ]

  const navigationControls = (isOwnBoard || boardId == "-1") ? [
    {
      icon: icons.back,
      label: "Back",
      onPress: () => router.back(),
    },
    {
      icon: icons.pencil,
      label: "New Post",
      onPress: handleNewPost,
      isCenter: true,
    },
    {
      icon: icons.settings,
      label: "Settings",
      onPress: () => {},
      isCenter: true,
    },
  ] : (!canParticipate ? 
    [
      {
        icon: icons.back,
        label: "Back",
        onPress: () => router.back(),
      },
      {
        icon: icons.send,
        label: "Share",
        onPress: () => {},
        
      },
      {
        icon: icons.shuffle,
        label: "Shuffle",
        onPress: () => {},
        isCenter: true,
      },
      {
        icon: joinedCommunity ? icons.close : icons.check,
        label: joinedCommunity ? "Leave" : "Join",
        onPress: joinCommunity,
      },
      {
        icon: icons.info,
        label: "Info",
        onPress: () => {},
      },
    ]
    
    : navigationUserControls)

  useEffect(() => {
    fetchBoard()
  }, [joinedCommunity])

  useEffect(() => {
    if (postId) {
      fetchPosts([postId as string])
    }
  }, [postId])

console.log("info pass to user profile", id, username, boardId)


  return (
    <>
    <View className="flex-1 bg-[#FAFAFA]">
       <LinearGradient
            colors={["#FAFAFA", "#FAFAFA"]} 
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            className="absolute w-full h-full inset-0 z-0"
          />
      
     
       
      <Header
      item={ <View className="m-6 flex-row justify-between items-center w-full px-4">
        <Animated.View entering={FadeIn.duration(800)}>
                       { username ? (
                       <View className="max-w-[200px]">
                          <Text className={`text-2xl font-JakartaBold`}>
                           {username}
                         </Text> 
                         </View>
                       ) : 
                        <Text className={`text-2xl bg-[#E7E5Eb] text-[#E7E5Eb] font-JakartaBold`}>Personal Board</Text>
                        }
                           { boardInfo ?  (<View className="max-w-[200px]">
                       <Text className=" text-xs text-gray-600 text-left font-Jakarta">
                           {boardInfo.description}
                         </Text> 
                       </View>) : (
                         <View>
                         <Text className=" text-xs text-gray-600 text-left font-Jakarta">
                         </Text> 
                         </View>)}
         </Animated.View>
          { boardInfo && <View className="flex-row gap-6 mr-7">
                             <View>
                             <Text className="text-lg font-JakartaSemiBold">
                               {postCount}
                             </Text>
                             <Text className="text-xs font-JakartaSemiBold">
                               Posts
                             </Text>
                             </View>
                             <View className="flex-column items-start justify-center">
                             <Text className="text-lg font-JakartaSemiBold">
                               {boardInfo?.members_id.length}
                             </Text>
                             <Text className="text-xs font-JakartaSemiBold">
                               Members
                             </Text>
                             </View>
                         </View>}
         </View>}
      />
       

                        

      <PersonalBoard userId={id as string} boardId={boardId} />
      <CustomButtonBar
        buttons={navigationControls}
        />

    </View>
    {isModalVisible && post &&
      <PostModal isVisible={!!isModalVisible} selectedPosts={[post]} handleCloseModal={() => {setIsModalVisible(false)}} />}
  </>);
};

export default UserPersonalBoard;
