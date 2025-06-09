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
    label: "Welcome to the Starring",
    caption: "But, what is a starring?",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Your Turn!"
        content="Dive into creative exploration. Pick a cue, write your thoughts, and see how others responded to similar prompts. Every post is a chance to express and discover."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "What happens after I create a prompt?",
    caption: "Your prompt joins the global cue-pool!",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Cue the Chain Reaction!"
        content="Once you create a prompt, others can answer it. It might even end up in the trending list. Be the spark!"
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Answer your friend’s prompt?",
    caption: "Absolutely!",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Friendly Fire (of Inspiration)"
        content="See what your friends are wondering about and drop your take. It’s like passing notes but more existential."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Peek at trending prompts!",
    caption: "They’re hot!",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="What's Poppin'?"
        content="Explore what the world is thinking. Peek into trending cues and find ones that tickle your brain."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];

export const boardTutorialPages = [
  {
    label: "Welcome to the Boards",
    caption: "But, what is a board?",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Boards = Organized Chaos"
        content="Boards are your canvas. Stick posts, move stuff around, or create wild collages. It’s controlled creativity."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Personal Board",
    caption: "Your secret stash",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Private Playground"
        content="Your personal board is just for you. Think of it as a diary, but with colors and stickers."
        image={icons.lock}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Shared With Me Board",
    caption: "Other people’s thoughts in your space",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Shared Spaces"
        content="These boards were made by others but include you. It's like being tagged in a group thought."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Public Boards",
    caption: "Welcome to the jungle",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Anything Goes"
        content="Everyone can post here. Expect wisdom, chaos, and maybe a little meme magic."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Community Boards",
    caption: "Event-based or themed madness",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Curated by Coloré"
        content="These boards are special: hosted for holidays, challenges, or collective experiments. Join in!"
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];

export const createTutorialPages = [
  {
    label: "Welcome to create",
    caption: "Your toolbox of self-expression",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Unleash the Chaos (creatively)"
        content="The Create tab is where ideas take shape. Choose to make a post, start a board, or launch a prompt."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Posts",
    caption: "It all starts with a note",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Sticky Note, but Make it Art"
        content="Drop your thoughts in a post. Pick a color, throw an emoji, and let it live out loud."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Boards",
    caption: "Where your posts hang out",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Boards Galore!"
        content="Group your posts on a board. Design your space with stickers, themes, and a bit of flair."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Prompts",
    caption: "Fuel for thought",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Ask the World"
        content="Craft questions that spark reflection. Prompts can go viral or stay close to home."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];

export const myProfileTutorialPages = [
  {
    label: "Welcome to profile",
    caption: "But, what is a profile?",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="It’s You!"
        content="Your profile is your personal vibe page. It shows your nickname, unlocked colors, and favorite styles."
        image={icons.profile}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Introduce yourself",
    caption: "Make a statement, or a meme",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Add Some Flavor"
        content="Upload a pfp, drop a name, and maybe throw in your favorite emoji. Your friends want to know you!"
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];

export const userTutorialPages = [
  {
    label: "Welcome to their profile",
    caption: "Who’s this colorful being?",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Peep the Profile"
        content="This is someone else’s space. Check out their colors, posts, and style."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Thinking of interacting with them?",
    caption: "Be nice. Or mysterious.",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Make a Move"
        content="Send a friend request, leave a reaction, or post to their board if allowed. Who knows what could bloom."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];
