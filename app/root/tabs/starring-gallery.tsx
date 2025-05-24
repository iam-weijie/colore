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
} from "react-native";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import { useGlobalContext } from "@/app/globalcontext";
import CustomButton from "@/components/CustomButton";
import ModalSheet from "@/components/Modal";
import InfoScreen from "@/components/InfoScreen";
import EmojiBackground from "@/components/EmojiBackground";
import { icons, temporaryColors } from "@/constants";
import { PostItColor, Prompt } from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";
import { LinearGradient } from "expo-linear-gradient";
import { RenderPromptCard } from "@/components/RenderCard";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import Header from "@/components/Header";
import CardCarrousel from "@/components/CardCarroussel";
import StarringPeekTab from "@/components/StarringModal";
import StarringModal from "@/components/StarringModal";

const screenWidth = Dimensions.get("window").width;

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
  const [selectedTab, setSelectedTab] = useState<string>("Starring");

  const selectedPostRef = useRef<Post | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const [selectedModal, setSelectedModal] = useState<any>();

  const starringTabs = [
    { name: "Create", key: "Create", color: "#CFB1FB", notifications: 0 },
    {
      name: "Answer",
      key: "Answer",
      color: "#CFB1FB",
    },
    { name: "Peek", key: "Peek", color: "#93c5fd", notifications: 0 },
  ];

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
        //TODO Adjust this to get trending posts
        `/api/posts/getTrendingPosts?number=${isIpad ? 24 : 18}&id=${user?.id}`
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
      const response = await fetchAPI(`/api/prompts/getPrompts`);

      // Filter out duplicates based on item.cue
      const hasRecentPrompt = response.data.find((p) => p.user_id == user!.id);

      console.log("has submitted prompt", hasSubmittedPrompt, typeof user!.id);
      console.log(
        response.data.find((p) => {
          return String(p.user_id).trim() === String(user!.id).trim();
        })
      );

      if (hasRecentPrompt) {
        const daysDifference =
          (Date.now() - new Date(hasRecentPrompt.created_at).getTime()) /
          (1000 * 60 * 60 * 24);

        console.log("Days difference", daysDifference);
        if (daysDifference < 0.75) {
          setHasSubmittedPrompt(hasRecentPrompt);
        }
      }

      const uniquePrompts = response.data.filter(
        (value, index, self) =>
          index ===
          self.findIndex(
            (t) => t.cue === value.cue // Compare by cue
          )
      );

      setPrompts(uniquePrompts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // reset modal visible each time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setSelectedModal(
        <InfoScreen
          title="Your Turn!"
          content="Dive into creative exploration.
                  Pick a cue, write your thoughts, and see how others responded to similar prompts.
                  Every post is a chance to express and discover."
          image={icons.star}
          onAgree={() => {
            setSelectedModal(null);
          }}
        />
      );
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
    fetchPrompts();
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
        const newPosts = posts.filter((post) => !existingIds.includes(post.id));

        // If there are new posts, add them to the stack
        if (newPosts.length > 0) {
          const newIds = [...existingIds, ...newPosts.map((post) => post.id)];
          const newElements = [...existingElements, ...newPosts];

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

  const updatePromptContent = (text: string) => {
    const maxCharacters = 40;
    if (text.length <= maxCharacters) {
      setPromptContent(text);
    } else {
      setPromptContent(text.substring(0, maxCharacters));
      showAlert({
        title: "Limit Reached",
        message: `You can only enter up to ${maxCharacters} characters.`,
        type: "ERROR",
        status: "error",
      });
    }
  };

  // Reset prompt content on scroll
  const handleScrollBeginDrag = () => {
    setPromptContent("");
    if (inputRef.current) {
      inputRef.current.blur(); // Optionally blur the input on scroll
    }
  };

  const handlePromptSubmit = async (item: Prompt) => {
    try {
      await fetchAPI("/api/prompts/newPrompt", {
        method: "POST",
        body: JSON.stringify({
          content: `${item.cue} ${promptContent.toLocaleLowerCase()}`,
          clerkId: user!.id,
          theme: item.theme,
          cue: item.cue,
        }),
      });

      showAlert({
        title: "Prompt Submitted",
        message: `Your prompt was submitted successfully.`,
        type: "POST",
        status: "success",
        color: item.color,
      });
    } catch (error) {
      console.error("Couldn't submit prompt", error);
      showAlert({
        title: "Error",
        message: `Your prompt was not submitted.`,
        type: "ERROR",
        status: "error",
      });
    } finally {
      const timeoutId = setTimeout(() => {
        setHasSubmittedPrompt(true);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  };

  const handleTabChange = (tabKey: string) => {
    console.log("Tab changed to:", tabKey);
    setSelectedTab(tabKey);
  };

  return (
    <View className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          className="flex-1"
          keyboardVerticalOffset={32} // adjust if your header height is different
        >
          <View className="flex-1">
            <Header
              title="Starring"
              tabs={starringTabs}
              selectedTab={selectedTab}
              onTabChange={handleTabChange}
              tabCount={starringTabs.length}
              className="z-10"
            />
            <EmojiBackground emoji="😳" color="#ffe640" />
            <StarringModal
              isVisible={isModalVisible}
              selectedPosts={posts}
              handleCloseModal={handleCloseModalPress}
              infiniteScroll={true}
              scrollToLoad={handleScrollToLoad}
            />
            {hasSubmittedPrompt ? (
              <>
                {/*
              //TODO Remake answer tab from scratch
              */}
                {/* <PostModal
                  isVisible={isModalVisible}
                  selectedPosts={posts}
                  header={
                    <Header
                      title="Starring"
                      tabs={starringTabs}
                      selectedTab={selectedTab}
                      onTabChange={handleTabChange}
                      className="z-10"
                    />
                  }
                  handleCloseModal={handleCloseModalPress}
                  infiniteScroll={true}
                  scrollToLoad={handleScrollToLoad}
                /> */}
              </>
            ) : (
              <>
                {/* <View className="flex-1">
              {loading ? (
                <View className="flex-1 items-center justify-center">
                  <ColoreActivityIndicator text="Summoning Bob..." />
                </View>
              ) : (
                <View className="flex-[0.85]">
                  <CardCarrousel
                    items={prompts}
                    renderItem={(item, index) => (
                      <RenderPromptCard
                        item={item}
                        userId={user!.id}
                        promptContent={promptContent}
                        updatePromptContent={updatePromptContent}
                        handlePromptSubmit={handlePromptSubmit}
                      />
                    )}
                    handleScrollBeginDrag={handleScrollBeginDrag}
                    inputRef={inputRef}
                  />
                </View>
              )}
            </View> */}
              </>
            )}
            {/* !!selectedModal && 
  <ModalSheet
  title=""
  isVisible={!!selectedModal}
  onClose={() => {setSelectedModal(null)}}>
   {selectedModal}
  </ModalSheet>*/}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
