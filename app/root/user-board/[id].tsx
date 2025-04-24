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

import Animated, { SlideInDown, SlideInUp, FadeInDown, FadeIn } from "react-native-reanimated";

const UserPersonalBoard = () => {
  const { user } = useUser();
  const { id, username, boardId } = useLocalSearchParams();
  const [boardInfo, setBoardInfo] = useState<any>();
  const isOwnBoard = !id || id == user?.id;
  const [postCount, setPostCount] = useState<number>(0);
  const [joinedCommunity, setJoinedCommunity] = useState<boolean>(false);
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

  const fetchBoard = async () => {
    try {
      const response = await fetchAPI(`/api/boards/getBoardById?id=${boardId}`)

      setBoardInfo(response.data)
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

  useEffect(() => {
    fetchBoard()
  }, [joinedCommunity])


console.log("info pass to user profile", id, username, boardId)


  return (
    <View className="flex-1 pt-16 bg-[#FAFAFA]">
       <LinearGradient
            colors={["#FAFAFA", "#FAFAFA"]} 
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            className="absolute w-full h-full inset-0 z-0"
          />
      
      <View className="mx-6 mt-6 relative">
     
       

        <View className="flex-row justify-between items-center">
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
          </View>

                        
      </View>
      <PersonalBoard userId={id as string} boardId={boardId} />
      <View className="absolute w-full flex-row items-center justify-between bottom-12  px-8 ">
      <TouchableOpacity onPress={() => router.back()} className="p-4 rounded-full bg-white shadow-md ">
          <AntDesign name="caretleft" size={18} />
        </TouchableOpacity>
        { (boardInfo && !isOwnBoard) && <TouchableOpacity onPress={() =>
          joinCommunity()
        } className="p-4 rounded-full bg-white shadow-md ">
          <Image
          source={joinedCommunity ? icons.close : icons.addUser}
          tintColor={"#000"}
          className="w-5 h-5"
          />
        </TouchableOpacity>}
      </View>
    </View>
  );
};

export default UserPersonalBoard;
