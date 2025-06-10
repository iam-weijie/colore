import PostModal from "@/components/PostModal";
import { fetchAPI } from "@/lib/fetch";
import { Post, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
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
  FlatList,
  Platform,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import { useGlobalContext } from "@/app/globalcontext";
import CustomButton from "@/components/CustomButton";
import ModalSheet from "@/components/Modal";
import InfoScreen from "@/components/InfoScreen";
import EmojiBackground from "@/components/EmojiBackground";
import { icons } from "@/constants";
import { PostItColor, Prompt } from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  RenderPromptCard,
  RenderPromptAnswerCard,
} from "@/components/RenderCard";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import Header from "@/components/Header";
import CardCarrousel from "@/components/CardCarroussel";
// import StarringPeekTab from "@/components/StarringModal";
import StarringModal from "@/components/StarringModal";
import {
  convertToLocal,
  formatDateTruncatedMonth,
  getRelativeTime,
} from "@/lib/utils";
import { allColors } from "@/constants/colors";

const screenWidth = Dimensions.get("window").width;

const CreateView = ({
  loading,
  prompts,
  promptContent,
  inputRef,
  handleScrollBeginDrag,
  updatePromptContent,
  handlePromptSubmit,
  userId,
}: any) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={80}
    style={{ flex: 1 }}
  >
    {loading ? (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ColoreActivityIndicator text="Loading…" />
      </View>
    ) : (
      <CardCarrousel
        items={prompts}
        renderItem={(prompt: Prompt) => (
          <RenderPromptCard
            item={prompt}
            userId={userId}
            promptContent={promptContent}
            updatePromptContent={updatePromptContent}
            handlePromptSubmit={handlePromptSubmit}
            inputRef={inputRef}
          />
        )}
        handleScrollBeginDrag={handleScrollBeginDrag}
        inputRef={inputRef}
      />
    )}
  </KeyboardAvoidingView>
);

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
  const [personalPrompts, setPersonalPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const selectedPostRef = useRef<Post | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const [selectedModal, setSelectedModal] = useState<any>();

  const [isPeekModalVisible, setPeekModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"Create" | "Answer" | "Peek">(
    "Create"
  );
  const [hasFetchedPersonalPrompts, setHasFetchedPersonalPrompts] =
    useState(false);

  const tabs = [
    { name: "Create", key: "Create", color: "#CFB1FB" },
    { name: "Answer", key: "Answer", color: "#93C5FD" },
    { name: "Peek", key: "Peek", color: "#FBD38D" },
  ] as const;

  const renderPrompt = useCallback(
    ({ item }: { item: Prompt }) => (
      <RenderPromptCard
        item={item}
        userId={user!.id}
        promptContent={item.cue}
        updatePromptContent={(text: string) => {}}
        handlePromptSubmit={() => {}}
      />
    ),
    [user!.id]
  );

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
        `/api/posts/getTrendingPosts?number=${isIpad ? 24 : 18}&id=${user?.id}`
      );
      //log
      console.log("Fetched posts:", res.data[0]);
      setPosts(res.data);
      // prime for peek
      setPeekModalVisible(true);
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // 4) fetch personal posts
  const fetchPersonalPrompts = useCallback(async () => {
    if (hasFetchedPersonalPrompts) return; // ← bail out if already loaded
    setAnswerLoading(true);
    try {
      const res = await fetchAPI(
        `/api/prompts/getPromptAnswers?user_id=${user?.id}`,
        { method: "GET" }
      );
      setPersonalPrompts(Array.isArray(res.posts) ? res.posts : []);
      setHasFetchedPersonalPrompts(true); // ← mark as fetched
    } catch {
      setError("Failed to load personal prompts");
    } finally {
      setAnswerLoading(false);
    }
  }, [hasFetchedPersonalPrompts, user?.id]);

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
          const uniqueIds = Array.from(new Set(newIds));
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

  useEffect(() => {
    if (selectedTab === "Peek") {
      setPeekModalVisible(true);
    }
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === "Answer" && !hasFetchedPersonalPrompts) {
      fetchPersonalPrompts();
    }
  }, [selectedTab, hasFetchedPersonalPrompts, fetchPersonalPrompts]);

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

  const handlePromptSubmit = async (item: Prompt, content: string) => {
    try {
      await fetchAPI("/api/prompts/newPrompt", {
        method: "POST",
        body: JSON.stringify({
          content: `${item.cue} ${content?.toLocaleLowerCase()}`,
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

  const handleTabChange = (key: (typeof tabs)[number]["key"]) => {
    setSelectedTab(key);
    // open peek modal whenever we switch to Peek
    if (key === "Peek") setPeekModalVisible(true);
  };

  const handleCreateScrollBegin = () => {
    inputRef.current?.blur();
  };

  const AnswerView = () => {
    // locally ensure posts is an array
    const personalPosts = Array.isArray(personalPrompts) ? personalPrompts : [];
    // console.log("[AnswerView] personalPrompts:", personalPrompts);

    return (
      <View className="flex-1 px-4 py-2">
        {answerLoading ? (
          <View className="flex-1 items-center justify-center">
            <ColoreActivityIndicator text="Loading my prompts…" />
          </View>
        ) : //ts-ignore-next-line

        personalPosts.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg">You haven’t posted anything yet!</Text>
          </View>
        ) : (
          // <CardCarrousel
          //   items={personalPosts}
          //   renderItem={(prompt: Prompt) => (
          //     <RenderPromptAnswerCard item={prompt} />
          //   )}
          //   handleScrollBeginDrag={handleScrollBeginDrag}
          // />
          <FlatList
            data={personalPosts}
            keyExtractor={(item) => item.id.toString()}
            numColumns={isIpad ? 3 : 1}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const backgroundColor = "white"; // Default color
              // allColors?.find((c) => c.id === item.color)?.hex || item.color;
              return (
                // ← YOU WERE MISSING THIS RETURN!
                <View
                  className="w-full mb-3 py-4 px-6 mx-auto"
                  style={{
                    borderRadius: 32,
                    backgroundColor,
                    borderColor: "#ffffff90",
                    borderWidth: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="font-JakartaSemiBold mb-1">
                    {item.prompt ?? "Untitled Prompt"}
                  </Text>
                  <Text
                    className="font text-black/90 text-[15px] shadow leading-snug"
                    numberOfLines={3}
                  >
                    {item.content}
                  </Text>

                  <Text className="mt-1 text-sm text-gray-500">
                    {formatDateTruncatedMonth(new Date(item.created_at))} •{" "}
                    {getRelativeTime(item.created_at)}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SafeAreaView style={{ flex: 1 }}>
            <Header
              title="Starring"
              tabs={tabs}
              selectedTab={selectedTab}
              onTabChange={handleTabChange}
              tabCount={tabs.length}
              style={{ zIndex: 10 }}
            />
            <EmojiBackground emoji="⭐️" color="#c3e3fd" />
            {/* Render content based on selected tab */}
            {selectedTab === "Create" && (
              <CreateView
                userId={user!.id}
                loading={loading}
                prompts={prompts}
                promptContent={promptContent}
                handleScrollBeginDrag={handleCreateScrollBegin}
                updatePromptContent={updatePromptContent}
                handlePromptSubmit={handlePromptSubmit}
                inputRef={inputRef}
                disableShadow={true}
              />
            )}
            {selectedTab === "Answer" && <AnswerView />}
            <StarringModal
              isVisible={selectedTab === "Peek" && isPeekModalVisible}
              selectedPosts={posts}
              handleCloseModal={() => setPeekModalVisible(false)}
              infiniteScroll
              scrollToLoad={async () => {
                setLoading(true);
                await fetchPosts();
                setLoading(false);
              }}
            />
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}
