import { icons } from "@/constants";
import React from "react";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import * as Haptics from "expo-haptics";
import { TutorialScreen } from "@/components/InfoScreen";

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

export const boardTutorialPages = [
  {
    label: "Welcome to Boards",
    caption: "Your space. Your layout.",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Boards = Organized Chaos"
        content="Boards are your creative playground. Pin and place posts however you like—each move is saved. Craft wild, chaotic layouts or keep it neat—it’s your vibe."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Personal Board",
    caption: "Private thoughts, curated by you",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Your Secret Space"
        content="Only you can see this board. Use it to track moods, save favorite posts, or build a colorful diary of your inner world."
        image={icons.lock}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Shared With Me",
    caption: "A gentle blend of others and you",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Shared Spaces"
        content="These boards were created by others but include you. They’re not editable yet—but they’re windows into conversations you’re part of."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Public Boards",
    caption: "A shared world of randomness",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Enter the Wild West"
        content="Public boards are open canvases for everyone—but only the creator can organize or star posts. Expect insight, noise, and a dash of chaos. Light moderation included."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Community Boards",
    caption: "Themed chaos with a cause",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Coloré Curates"
        content="These boards are event-based or seasonal. Think: holidays, challenges, collective rituals. Join the madness while it’s live!"
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];

export const createTutorialPages = [
  {
    label: "Create Anything",
    caption: "Where creativity takes off",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Unleash the Chaos (creatively)"
        content="In the Create tab, you can write posts, launch prompts, or build boards. It’s your toolbox for storytelling, thinking out loud, or making weirdly aesthetic art."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Posts",
    caption: "Mini statements with major feels",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Sticky Note, but Make it Art"
        content="Write your thoughts with styled text—bold, lists, headers, italics—and add emoji that float or fall. Choose a color, and let the mood shine through."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Boards",
    caption: "Home for your post-it thoughts",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Boards Galore!"
        content="Arrange your posts however you want. There are no templates yet—but that’s the point. Style it freely, go wild, or stay minimal. You decide."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Prompts",
    caption: "Fuel your curiosity",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Ask the World"
        content="Start meaningful conversations by selecting a cue and writing a prompt. Be funny, philosophical, or real—your prompt might just go viral."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];

export const myProfileTutorialPages = [
  {
    label: "Welcome to You",
    caption: "Where your identity lives (or hides)",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Your Vibe Page"
        content="This is your colorful identity space. See your pinned posts, earned colors, and display name. Customize your look—or keep it low-key."
        image={icons.profile}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Introduce Yourself",
    caption: "Your way, your layers",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Pin. Post. Persona."
        content="Set a public name, a secret incognito name, and a nickname for friend requests. Pin posts to act as a bio—or leave a little mystery."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];

export const userTutorialPages = [
  {
    label: "Who’s this?",
    caption: "Explore their vibe",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Peep the Profile"
        content="This is someone else’s vibeboard. You can scroll through their public posts, style, and colors—but this isn’t your sandbox."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
  {
    label: "Thinking of interacting?",
    caption: "Tread curiously",
    color: "#93c5fd",
    disabled: false,
    children: (
      <TutorialScreen
        title="Make a Move"
        content="Leave a post on their board, nickname them for your own records, or report them if needed. Once you’re friends, you can even share post stacks."
        image={icons.star}
        onAgree={() => {}}
        hasAction={false}
      />
    ),
  },
];
