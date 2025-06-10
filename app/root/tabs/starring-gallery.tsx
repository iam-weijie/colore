import { fetchAPI } from "@/lib/fetch";
import { Post, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  FlatList,
  Platform,
  TouchableOpacity,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import { useGlobalContext } from "@/app/globalcontext";
import CustomButton from "@/components/CustomButton";
import InfoScreen from "@/components/InfoScreen";
import EmojiBackground from "@/components/EmojiBackground";
import { icons } from "@/constants";
import { PostItColor, Prompt } from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  RenderPromptCard,
} from "@/components/RenderCard";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import Header from "@/components/Header";
import CardCarrousel from "@/components/CardCarroussel";
import StarringContainer from "@/components/StarringContainer";
import {
  convertToLocal,
  formatDateTruncatedMonth,
  getRelativeTime,
} from "@/lib/utils";
import { allColors } from "@/constants/colors";
import PostGallery from "@/components/PostGallery";
import { Ionicons } from "@expo/vector-icons";
import { checkTutorialStatus, completedTutorialStep } from "@/hooks/useTutorial";
import { starringTutorialPages } from "@/constants/tutorials";
import CarouselPage from "@/components/CarrousselPage";
import ModalSheet from "@/components/Modal";

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
  <View className="flex-1 mb-[90px]">
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          />
        )}
        handleScrollBeginDrag={handleScrollBeginDrag}
        inputRef={inputRef}
      />
    )}
  </KeyboardAvoidingView>
  </View>
);

export default function Page() {
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { isIpad, stacks, setStacks, profile } = useGlobalContext();

  // Tutorial constants
  
  const pages = starringTutorialPages;
  const totalSteps = pages.length;
  
  
  // Tutorial Logic
  const [skipIntro, setSkipIntro] = useState<boolean>(false);
  
    const fetchTutorialStatus = async () => {
      const isTutorialcompleted = await checkTutorialStatus("starring-1")
      setSkipIntro(isTutorialcompleted)
    }
    const handleCompleteTutorial = async () => {
      const isCompleted = await completedTutorialStep("starring-1")
      return isCompleted
    }
    
  useEffect(() => {
  fetchTutorialStatus()
  }, [])
  const [step, setStep] = useState(0);
    const handleNext = () => {
  
      if (step < totalSteps - 1) setStep((prev) => prev + 1);
      else {
        handleCompleteTutorial()
        setSkipIntro(true)
      }
    };
  

  const [userInfo, setUserInfo] = useState<UserData | null>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [promptContent, setPromptContent] = useState<string>("");

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [personalPrompts, setPersonalPrompts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
   const [query, setQuery] = useState<string>("");

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
  }, [hasFetchedPersonalPrompts]);

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
     
        fetchPosts()
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

  useEffect(() => {
    if (selectedTab === "Peek") {
      setPeekModalVisible(true);
    }
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === "Answer" && !hasFetchedPersonalPrompts) {
      fetchPersonalPrompts();
    }
  }, [selectedTab, hasFetchedPersonalPrompts]);


  // Clear current search

  const handleClearSearch = () => {
  setQuery("");
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
        color: "#ffe640",
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
      setPromptContent("");
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

    return (
      <View className="flex-1 px-4 py-2 bg-[#FAFAFA]">
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
          <>
                      <View className="absolute  flex flex-row items-center bg-white rounded-[24px] px-4 h-12 w-[90%] top-6 self-center z-[10] "
        style={{
          boxShadow: "0 0 7px 1px rgba(120,120,120,.1)"
        }}
        >
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 pl-2 text-md "
            placeholder="Looking for a Post..?"
             placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              className="w-6 h-6 items-center justify-center"
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
         <PostGallery
          posts={personalPosts ?? []} 
          profileUserId={user!.id}  
          query={query}
          offsetY={70}       
         />
         </>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView>
      <View className="flex-1 bg-[#FAFAFA]">
            <Header
              title="Starring"
              tabs={tabs}
              selectedTab={selectedTab}
              onTabChange={handleTabChange}
              tabCount={tabs.length}
              style={{ zIndex: 10 }}
            />
            
            {/* Render content based on selected tab */}
            {selectedTab === "Create" && (
              <>
              <EmojiBackground emoji="🤩" color="#ffe640" />
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
              </>
            )}
            {selectedTab === "Answer" && <AnswerView />}
            {selectedTab === "Peek" &&
            
            <StarringContainer
              selectedPosts={posts}
              handleCloseModal={() => {}}
              infiniteScroll
              scrollToLoad={async () => {
                setLoading(true);
                await fetchPosts();
                setLoading(false);
              }}
            />
            
}
 {!skipIntro && <ModalSheet 
        title={""} 
        isVisible={!skipIntro} 
        onClose={() => {
          setSkipIntro(true)
          }} >
            <View className="flex-1 px-4">
            <CarouselPage
          label={pages[step].label}
          caption={pages[step].caption}
          color={pages[step].color}
          onSubmit={handleNext}
          progress={step + 1}
          total={totalSteps}
          disabled={pages[step].disabled}
        >
          {pages[step].children}
        </CarouselPage>
        </View>
        </ModalSheet>}
            </View>
    </GestureHandlerRootView>
  );
}
