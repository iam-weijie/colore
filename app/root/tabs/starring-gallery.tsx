import PostModal from "@/components/PostModal";
import { fetchAPI } from "@/lib/fetch";
import { Post, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from "react-native";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import { useGlobalContext } from "@/app/globalcontext";
import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";

export default function Page() {
  const { user } = useUser();
  const { isIpad, stacks, setStacks } = useGlobalContext();

  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [promptContent, setPromptContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPostRef = useRef<Post | null>(null);

  // 1) request ATT permission
  const requestPermission = async () => {
    const status = await requestTrackingPermission();
    console.log(`Tracking permission ${status}`);
  };

  // 2) fetch the user profile
  const fetchUserData = async () => {
    try {
      const res = await fetchAPI(`/api/users/getUserInfo?id=${user?.id}`);
      if (res.data?.length) setUserInfo(res.data[0]);
    } catch (e) {
      console.error("Failed to fetch user data:", e);
      setError("Failed to load profile");
    }
  };

  // 3) fetch initial batch of posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI(
        `/api/posts/getRandomPosts?number=${isIpad ? 10 : 6}&id=${user?.id}`
      );
      setPosts(res.data);
      selectedPostRef.current = res.data[0];
      setExcludedIds(res.data.map((p: Post) => p.id));
    } catch (e) {
      console.error("Failed to fetch posts:", e);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // reset modal visible each time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsModalVisible(true);
      if (user && stacks.length == 0) {  
        fetchPosts();
        
      } else if (user && stacks.length > 0) {
        setPosts(stacks[0].elements);
        setExcludedIds(stacks[0].ids);
      }
      
    }, [user, isIpad])
  );

  // on-mount (and whenever user / isIpad changes) load everything
  useEffect(() => {
    requestPermission();
    if (user) {
      fetchUserData();
      if (stacks.length == 0) {
      fetchPosts();
      }
    }
  }, [user, isIpad]);

  // Ensure uniqueness of posts and ids in stack
  useEffect(() => {
    if (posts.length > 0) {
      setStacks((prev) => {
        // Ensure only the first stack is updated or created
        const existingIds = prev.length > 0 ? prev[0].ids : [];
        const existingElements = prev.length > 0 ? prev[0].elements : [];

        // Filter out posts with duplicate IDs and elements
        const newPosts = posts.filter(
          (post) => !existingIds.includes(post.id)
        );

        // If there are new posts, add them to the stack
        if (newPosts.length > 0) {
          const newIds = [
            ...existingIds,
            ...newPosts.map((post) => post.id),
          ];
          const newElements = [
            ...existingElements,
            ...newPosts,
          ];

          // Remove duplicates from newIds and newElements
          const uniqueIds = [...new Set(newIds)];
          const uniqueElements = newElements.filter(
            (value, index, self) =>
              index === self.findIndex((el) => el.id === value.id)
          );

          return [
            {
              ids: uniqueIds,
              elements: uniqueElements,
            },
          ];
        }
        return prev; // If no new posts, return the previous state
      });
    }
  }, [posts]);

  const handlePromptSubmit = async () => {
     try {
           await fetchAPI("/api/prompts/newPrompt", {
             method: "POST",
             body: JSON.stringify({
               content: promptContent,
               clerkId: user!.id,
             }),
           });
          }
        catch(error) {
          console.error("Couldn't submit prompt", error)
        } finally {
          setHasSubmittedPrompt(true)
        }
   
  };

  const handleCloseModalPress = () => {
    router.replace("/root/tabs/home");
    setIsModalVisible(false);
    setStacks([])
  };

  const handleScrollToLoad = async () => {
    setLoading(true);
    fetchPosts();
    setLoading(false);
  };

  if (!selectedPostRef.current) return null; // or your skeleton

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator 
        size={"small"}
        color={"#888"}
        ></ActivityIndicator>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        {hasSubmittedPrompt ? (<PostModal
          isVisible={isModalVisible}
          selectedPost={selectedPostRef.current}
          handleCloseModal={handleCloseModalPress}
          infiniteScroll={true}
          scrollToLoad={handleScrollToLoad}
        />) : (
            <TouchableWithoutFeedback
                    onPress={() => Keyboard.dismiss()}
                    onPressIn={() => Keyboard.dismiss()}
                  >
          <View className="flex-1">
           
            <View className="mt-3 mx-7">
              <Text className="text-2xl font-JakartaBold my-4">Starring</Text>
            </View>
          <View className="flex-[0.85] flex-column items-center justify-center ">
            <View className="flex w-full flex-col items-center justify-center">
              <Text className="my-4 text-[#888] text-[12px] font-JakartaSemiBold"> Answer this prompt to see other people's response </Text>
              <Text className="text-[24px] font-JakartaBold">Promts</Text>
            </View>
            <KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">
               <View>
                              <TextInput
                                className="text-[20px] text-black p-5 rounded-[24px] font-JakartaBold mx-10 "
                                placeholder="Type something..."
                                value={promptContent}
                                onChangeText={setPromptContent}
                                autoFocus
                                multiline
                                scrollEnabled
                                style={{
                                  paddingTop: 10,
                                  paddingBottom: 0,
                                  minHeight: 200,
                                  maxHeight: 300,
                                  textAlignVertical: "top",
                                }}
                              />
                              </View>
            </KeyboardAvoidingView>
             <CustomButton
              className="w-[50%] h-16 rounded-full shadow-none bg-black"
              fontSize="lg"
              title="Next"
              padding="0"
              onPress={handlePromptSubmit}
              //disabled={}//navigationIndex < (type === 'community' ? tabs.length - 1 : tabs.length - 2)}
            />
          </View>
          </View>
          </TouchableWithoutFeedback>
        )}
      </SignedIn>
    </SafeAreaView>
  );
}
