import { useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Header from "@/components/Header";
import CardCarrousel from "@/components/CardCarroussel";
import { RenderCreateCard } from "@/components/RenderCard";
import { useAlert } from '@/notifications/AlertContext';
import EmojiBackground from "@/components/EmojiBackground";
import { fetchAPI } from "@/lib/fetch";
import { icons } from "@/constants";
import { 
  addDays
} from 'date-fns';
import { useGlobalContext } from "@/app/globalcontext";
import { checkTutorialStatus } from "@/hooks/useTutorial";
import { createTutorialPages } from "@/constants/tutorials";
import ModalSheet from "@/components/Modal";
import CarouselPage from "@/components/CarrousselPage";




const Create = () => {

const { user } = useUser();

// Tutorial constants

const pages = createTutorialPages;
const totalSteps = pages.length;


// Tutorial Logic
const [skipIntro, setSkipIntro] = useState<boolean>(false);

useEffect(() => {
  const fetchTutorialStatus = async () => {
  const isTutorialcompleted = await checkTutorialStatus("create-1")
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

const { draftPost, resetDraftPost } = useGlobalContext()
const [selectedTab, setSelectedTab] = useState<string>("notes");

const tabs = [
  { name: "Prompts", key: "prompts", color: "#CFB1FB", notifications: 0 },
  { name: "Notes", key: "notes", color: "#CFB1FB" },
  { name: "Boards", key: "boards", color: "#93c5fd", notifications: 0 }
];

// Generic navigation handler
const navigateTo = ({
  type,
  params = {},
}: {
  type: "prompt" | "note" | "board";
  params?: Record<string, any>;
}) => {
  let pathname = "";
  let reset = true;
  
  if (draftPost.recipient_user_id && params.recipientId && draftPost.recipient_user_id == params.recipientId ) reset = false;
  if (draftPost.expires_at && params.expiration) reset = false;

  if (reset) resetDraftPost();

  switch (type) {
    case "prompt":
    case "note":
      pathname = "root/new-post";
      break;
    case "board":
      pathname = "root/new-board";
      break;
  }

  router.push({ pathname, params });
};

const handlePromptSubmit = async () => {
  try {
    const response = await fetchAPI("/api/prompts/getPrompts");
    const uniquePrompts = response.data.filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.cue === value.cue)
    );

    const randomIndex = Math.floor(Math.random() * uniquePrompts.length);
    const prompt = uniquePrompts[randomIndex];

    navigateTo({
      type: "prompt",
      params: {
        prompt: prompt.content,
        promptId: prompt.id,
      },
    });
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
  }
};

const promptOptions = [
  {
    label: "Answer a prompt",
    icon: icons.fire,
    caption: "You and a random thought!",
    onPress: handlePromptSubmit,
  },
];

const notesOptions = [
  {
    label: "Temporary Notes",
    icon: icons.timer,
    caption: "Quick, it will disappear!",
    onPress: () =>
      navigateTo({
        type: "note",
        params: {
          expiration: new Date(addDays(new Date(), 3)).toISOString(),
        },
      }),
  },
  {
    label: "Global Notes",
    icon: icons.globe,
    caption: "A thought for the world to see!",
    onPress: () =>
      navigateTo({
        type: "note",
      }),
  },
  {
    label: "Personal Notes",
    icon: icons.lock,
    caption: "A thought? Write in here!",
    onPress: () =>
      navigateTo({
        type: "note",
        params: {
          recipientId: user!.id,
          username: "Yourself",
        },
      }),
  },
];

const boardOptions = [
  {
    label: "Private Board",
    icon: icons.bookmark,
    caption: "Only you can post here!",
    onPress: () =>
      navigateTo({
        type: "board",
        params: { type: "personal" },
      }),
  },
  {
    label: "Community Board",
    icon: icons.comment,
    caption: "Hear everyone's thoughts!",
    onPress: () =>
      navigateTo({
        type: "board",
        params: { type: "community" },
      }),
  },
];

const handleTabChange = (tabKey: string) => {
  setSelectedTab(tabKey);
};
  
  
  return (
    <View className="flex-1">
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
        >
       
          
                    
            <Header 
            title="Create"
            tabs={tabs}
            selectedTab={selectedTab}
            onTabChange={handleTabChange} 
            tabCount={0}  
            />
        </TouchableWithoutFeedback>
        <EmojiBackground 
        emoji=""
        color="#93c5fd"
        />
        <View className="flex-1 mb-[90px]">
        <CardCarrousel
            items={
              selectedTab == "prompts" ? promptOptions : 
              (selectedTab == "notes") ? notesOptions : 
              boardOptions
            }
            renderItem={(item, index) => 
              <RenderCreateCard
          item={item}
          handleOptionSubmit={() => item.onPress()}
          />}/>
        </View>
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
};


export default Create;
