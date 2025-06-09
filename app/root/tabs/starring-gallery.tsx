import { fetchAPI } from "@/lib/fetch";
import { Post, UserData } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import { useGlobalContext } from "@/app/globalcontext";
import EmojiBackground from "@/components/EmojiBackground";
import { PostItColor, Prompt } from "@/types/type";
import { useAlert } from "@/notifications/AlertContext";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import Header from "@/components/Header";
import StarringModal from "@/components/StarringModal";
import { checkTutorialStatus } from "@/hooks/useTutorial";
import { starringTutorialPages } from "@/constants/tutorials";
import CarouselPage from "@/components/CarrousselPage";
import ModalSheet from "@/components/Modal";

const screenWidth = Dimensions.get("window").width;

export default function Page() {
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { isIpad, profile } = useGlobalContext();

  // Tutorial constants
  
  const pages = starringTutorialPages;
  const totalSteps = pages.length;
  
  
  // Tutorial Logic
  const [skipIntro, setSkipIntro] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchTutorialStatus = async () => {
    const isTutorialcompleted = await checkTutorialStatus("starring-1")
    setSkipIntro(isTutorialcompleted)
  }
  fetchTutorialStatus()
  }, [])
  const [step, setStep] = useState(0);
    const handleNext = () => {
  
      if (step < totalSteps - 1) setStep((prev) => prev + 1);
      else {
        setSkipIntro(true)
      }
    };
  

  const [userInfo, setUserInfo] = useState<UserData | null>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [promptContent, setPromptContent] = useState<string>("");

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("Create");

  const selectedPostRef = useRef<Post | null>(null);
  const inputRef = useRef<TextInput>(null);

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
      const response = await fetchAPI(
        //TODO Adjust this to get trending posts
        `/api/posts/getTrendingPosts?number=${isIpad ? 24 : 18}&id=${user?.id}`
      );

      
      setPosts(response.data);
      selectedPostRef.current = response.data[0];
      setExcludedIds(response.data.map((p: Post) => p.id));
      setLoading(false);
    } catch (e) {
      console.error("Failed to fetch posts:", e);
      setError("Failed to load posts");
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
     
        fetchPosts();
      
    }, [user])
  );

  // on-mount (and whenever user / isIpad changes) load everything
  useEffect(() => {
    requestPermission();
    fetchPrompts();
    if (user) {
      fetchUserData();
      fetchPosts();
    }
  }, [user]);



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
        <KeyboardAvoidingView behavior="height" className="flex-1">
          <View className="flex-1">
            <Header
              title="Starring"
              tabs={starringTabs}
              selectedTab={selectedTab}
              onTabChange={handleTabChange}
              tabCount={starringTabs.length}
            />
            <EmojiBackground emoji="" color="#ffe640" />
             {loading ? (
              <View className="flex-1 flex-col items-center justify-center">
                <ColoreActivityIndicator colors={["#FFFFFF", "#FFFFFF", "#FFFFFF"]}/>
              </View>
            ) : posts.length > 0 ? (
              <View className="flex-1 absolute top-[5%]">
              <StarringModal
                isVisible={true}
                selectedPosts={posts}
                handleCloseModal={() => {}}
                infiniteScroll={true}
                scrollToLoad={handleScrollToLoad}
              />
              </View>
              
            ) : (
              <View>
                <Text>No posts available</Text>
              </View>
            )}
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
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  );
}
