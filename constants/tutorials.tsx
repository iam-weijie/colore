import { useUser } from "@clerk/clerk-expo";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { useNavigationContext } from "@/components/NavigationContext";
import { fetchAPI } from "@/lib/fetch";
import { useAlert } from "@/notifications/AlertContext";
import CarouselPage from "@/components/CarrousselPage";
import { PostItColor } from "@/types/type";
import BoardGallery from "@/components/BoardGallery";
import ItemContainer from "@/components/ItemContainer";
import { icons } from "@/constants";
import { allColors } from "@/constants/colors";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";
import React from "react";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import * as Haptics from "expo-haptics";
import InfoScreen, { TutorialScreen } from "@/components/InfoScreen";

export const starringTutorialPages = [
  {
    label: "Welcome to Starring",
    caption: "Explore prompts. Spark ideas. Reflect out loud.",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Your Turn!"
        content="Starring is where curiosity meets creativity. Answer thought-provoking prompts made from cues like 'school' or 'life.' Your response stays anonymous—freeing you to be real."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Creating a Prompt",
    caption: "Choose a cue. Ignite the thread.",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Cue the Chain Reaction!"
        content="When you create a prompt, others anonymously respond. The more interaction your prompt gets, the more it rises through the trending charts. Set off the spark!"
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Answer a Friend’s Prompt?",
    caption: "No names. Just truth.",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Drop Your Take"
        content="You can answer prompts from friends, too—but responses stay anonymous. It’s like whispering into the void and hearing how others echo back."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Peek at What’s Trending",
    caption: "See what the world is thinking.",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="What's Poppin'?"
        content="Discover the hottest prompts, filled with raw, creative, and hilarious anonymous responses. These are chosen based on engagement—likes, replies, and shares."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];

