import PostModal from "@/components/PostModal";
import { fetchAPI } from "@/lib/fetch";
import { Post, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  Animated,
  Dimensions,
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
import { icons, temporaryColors } from "@/constants";
import { PostItColor, Prompt } from "@/types/type";
import { useAlert } from '@/notifications/AlertContext';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

const RenderPromptCard = ({item, userId, promptContent, updatePromptContent, handlePromptSubmit} : {
  item: Prompt, userId: string, promptContent: string, updatePromptContent: (text: string) => void, handlePromptSubmit: (item: Prompt) => void }) => { 

    return (
      <TouchableWithoutFeedback
      className="flex-1"
      onPress={() => Keyboard.dismiss()}
      onPressIn={() => Keyboard.dismiss()}
    >
  <View className="flex-1 flex-column items-center justify-center mt-4 mb-8 py-8 rounded-[48px]" 
 style={{
  backgroundColor:  item.color ?? "yellow",
  width: screenWidth * 0.85}}>

  <View className="w-[85%] flex-1 mx-auto flex-col items-center justify-center">

  <Text className="my-1 text-[14px] font-JakartaBold text-[#FAFAFA]">{item.theme}</Text>
    <Text 
    
    className="text-[24px] text-center font-JakartaBold text-[#FFF]">{item.cue}...</Text>
  </View>
  <KeyboardAvoidingView behavior="padding" className="flex-1 my-6 flex w-full">
     <View className="mt-2">
                    <TextInput
                      className="text-[16px] text-[#FFF] p-5 rounded-[24px] font-JakartaBold mx-10 "
                      placeholder="Type something..."
                      value={promptContent}
                      onChangeText={updatePromptContent}
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
    className=" my-4 w-[50%] h-16 rounded-full shadow-none bg-black"
    fontSize="lg"
    title="submit"
    padding="0"
    disabled={promptContent.length === 0}
    onPress={() => {handlePromptSubmit(item)}}
    //disabled={}//navigationIndex < (type === 'community' ? tabs.length - 1 : tabs.length - 2)}
  />
</View>
</TouchableWithoutFeedback>
);}

export default function Page() {
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { isIpad, stacks, setStacks } = useGlobalContext();

  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [promptContent, setPromptContent] = useState<string>("");
  
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
      temporaryColors[Math.floor(Math.random() * 4)]
    );
  const [loading, setLoading] = useState(true);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPostRef = useRef<Post | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

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

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetchAPI(
        `/api/prompts/getPrompts`
      );

      
       // Filter out duplicates based on item.cue
    const hasRecentPrompt = response.data.find((p) => p.user_id == user!.id)

      console.log("has submitted prompt", hasSubmittedPrompt, typeof user!.id)
      console.log(response.data.find(p => {
        return String(p.user_id).trim() === String(user!.id).trim();
      }))
  
    if (hasRecentPrompt) {

      const daysDifference = (Date.now() - new Date(hasRecentPrompt.created_at).getTime()) / (1000 * 60 * 60 * 24)

      console.log("Days difference", daysDifference)
      if (daysDifference < 0.75) {
        setHasSubmittedPrompt(hasRecentPrompt);
      }
     
    }
  

    const uniquePrompts = response.data.filter((value, index, self) => 
      index === self.findIndex((t) => (
        t.cue === value.cue // Compare by cue
      ))
    );

    setPrompts(uniquePrompts);

    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

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
    fetchPrompts()
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



  const handleCloseModalPress = () => {
    router.push("/root/tabs/home");
    setIsModalVisible(false);
    //setStacks([])
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

  const updatePromptContent = (text: string) => {
    const maxCharacters = 40
    if (text.length <= maxCharacters) {
     setPromptContent(text)
      
    } else {
      setPromptContent(text.substring(0, maxCharacters))
      showAlert({
        title: 'Limit Reached',
        message: `You can only enter up to ${maxCharacters} characters.`,
        type: 'ERROR',
        status: 'error',
      });

    }
    }

  // Reset prompt content on scroll
  const handleScrollBeginDrag = () => {
    setPromptContent('');
    if (inputRef.current) {
      inputRef.current.blur(); // Optionally blur the input on scroll
    }
  }

  const handlePromptSubmit = async (item: Prompt) => {
    try {
          await fetchAPI("/api/prompts/newPrompt", {
            method: "POST",
            body: JSON.stringify({
              content: `${item.cue} ${promptContent.toLocaleLowerCase()}`,
              clerkId: user!.id,
              theme: item.theme,
              cue: item.cue
            }),
          });

          showAlert({
            title: 'Prompt Submitted',
            message: `Your prompt was submitted successfully.`,
            type: 'POST',
            status: 'success',
            color: item.color
          });
         }
       catch(error) {
         console.error("Couldn't submit prompt", error)
         showAlert({
          title: 'Error',
          message: `Your prompt was not submitted.`,
          type: 'ERROR',
          status: 'error',
        });
       } finally {
        const timeoutId = setTimeout(() => {
          setHasSubmittedPrompt(true);
        }, 2000);
      
        return () => clearTimeout(timeoutId);
      
       
       }
  
 };

 console.log("postref", selectedPostRef)
  return (
    <View className="flex-1">
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
          
                 <View className="flex-1 flex-row max-h-[18%] justify-between items-end pl-11  bg-[#FAFAFA]">
              <Text className="text-2xl font-JakartaBold my-4">Starring</Text>
            </View>
            <Text className="mt-4 mb-2 text-center text-[#CCCCCC] text-[12px] font-JakartaSemiBold"> Create a prompt with the given cues to view other people's responses </Text>
            {loading ? (
              <ActivityIndicator size={"small"} color={"#888"}/>
            ) 
            : (<Animated.FlatList
                className="flex-1"
                data={prompts}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: (screenWidth - screenWidth * 0.85) / 2 }}
                scrollEventThrottle={16}
                decelerationRate="fast"
                onScroll={
                    Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true }
                )
        
              }
                onScrollBeginDrag={handleScrollBeginDrag} 
                snapToInterval={screenWidth * 0.85 + 12} // Width + gap
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                renderItem={({ item, index }) => {
                  const inputRange = [
                    (index - 1) * (screenWidth * 0.85 + 12),
                    index * (screenWidth * 0.85 + 12),
                    (index + 1) * (screenWidth * 0.85 + 12)
                  ];

                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.92, 1, 0.92],
                    extrapolate: 'clamp',
                  });

                  const shadowOpacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.1, 0.3, 0.1],
                    extrapolate: 'clamp',
                  });

    return (
      <Animated.View
        style={{
          transform: [{ scale }],
          shadowColor: item.color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.7,
          shadowRadius: 12,
          elevation: 6, // Android shadow
        }}
      >
        {RenderPromptCard({ item: item, userId: user!.id, promptContent: promptContent, updatePromptContent, handlePromptSubmit})}
      </Animated.View>
    );
  }}
/>)}

          </View>
          </TouchableWithoutFeedback>
        )}

    </View>
  );
}


