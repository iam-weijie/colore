import React, { useState, useEffect, useRef } from "react";
import { Alert, Image, ImageSourcePropType, Text, TouchableOpacity, View } from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, BounceIn, FadeIn, FadeOut } from "react-native-reanimated";
import bob from "@/assets/characters/bob-1.png";
import steve from "@/assets/characters/steve-1.png";
import rosie from "@/assets/characters/rosie-1.png";


export const ActionType = Object.freeze({
  NONE: { name: "none" },
  EMPTY: { name: "empty" },
  WHILEAGO: { name: "whileago" },
  RECIPROCITY: { name: "reciprocity" },
  TIPS: { name: "tips" }
});

// Define prompts for each action type with title, body, and source
const actionPrompts = {
  none: (friendName) => [
    {
      title: "No action yet",
      body: `No action yet, but there's always time, ${friendName}!`,
      source: bob
    },
    {
      title: "Quiet moment",
      body: `It's quiet here, ${friendName}—start the conversation!`,
      source: steve
    },
    {
      title: "Random thought",
      body: `Feel free to leave a random thought, ${friendName}.`,
      source: rosie
    },
    {
      title: "The board awaits",
      body: `The board is waiting for something fun from you, ${friendName}.`,
      source: bob
    },
    {
      title: "Say hello",
      body: `Add a quick hello to break the silence, ${friendName}.`,
      source: steve
    }
  ],
  empty: (friendName) => [
    {
      title: "Empty board",
      body: `Looks like ${friendName}’s board is waiting for some love!`,
      source: steve
    },
    {
      title: "Fill the blank",
      body: `${friendName}’s board is empty—post a funny memory or quote!`,
      source: bob
    },
    {
      title: "Brighten their day",
      body: `Time to brighten up ${friendName}'s day with a sweet message!`,
      source: steve
    },
    {
      title: "Canvas for you",
      body: `It’s a blank canvas—leave a fun message for ${friendName}!`,
      source: rosie
    },
    {
      title: "Compliment time",
      body: `Maybe share a compliment or some good vibes with ${friendName}!`,
      source: bob
    }
  ],
  whileago: (friendName) => [
    {
      title: "Long time no post",
      body: `It’s been a while since you posted, ${friendName}! Drop a memory or update.`,
      source: steve
    },
    {
      title: "Catch up",
      body: `A lot of time has passed—catch ${friendName} up with your news!`,
      source: rosie
    },
    {
      title: "Make their day",
      body: `Send a quick message and make ${friendName}'s day better.`,
      source: bob
    },
    {
      title: "Time flies",
      body: `Time flies, ${friendName}! Share something you’ve been up to lately.`,
      source: steve
    },
    {
      title: "Reconnect",
      body: `Reconnect by leaving a message to remind ${friendName} you're thinking of them.`,
      source: rosie
    }
  ],
  reciprocity: (friendName) => [
    {
      title: "Your turn to reply",
      body: `Your friend ${friendName} just posted! Respond with a fun comment.`,
      source: bob
    },
    {
      title: "Show some love",
      body: `${friendName} showed love, now it’s your turn! Reply with a compliment.`,
      source: steve
    },
    {
      title: "Fun reply",
      body: `Reply to ${friendName}'s post with something funny or sweet!`,
      source: rosie
    },
    {
      title: "Support their post",
      body: `Your friend ${friendName} made the first move—leave a supportive message!`,
      source: bob
    },
    {
      title: "Share back",
      body: `${friendName} shared something, so why not share back?`,
      source: steve
    }
  ],
  tips: () => [
    {
      title: "Stacking Post-its",
      body: "Try sliding one post-it on top of another to stack them! This way, they can be visualized together instead of individually.",
      source: bob
    },
    {
      title: "Quick Stack",
      body: "Hold the background for 2 seconds to automatically stack all post-its together. It's a quick way to organize!",
      source: rosie
    }
  ]
};


type Prompt = {
  title: string;
  body: string;
  source: ImageSourcePropType;
};

interface ActionPromtsProps {
  source: ImageSourcePropType;
  friendName: string, 
  currentScreen: string;
  action: { name: string };
}

const ActionPrompts: React.FC<ActionPromptsProps> = ({ friendName, action }) => {
  const [randomPrompt, setRandomPrompt] = useState<Prompt | null>(null);

  // Initialize shared value for the Y translation
  const translateY = useSharedValue(200);  // Start off-screen

  useEffect(() => {

    const generateRandomPrompt = (actionName: string) => {
      const prompts = actionPrompts[actionName.toLowerCase()](friendName);

      console.log("Prompts generated:", prompts);  // Added logging to see what prompts were generated

      if (prompts && prompts.length > 0) {
        const randomIndex = Math.floor(Math.random() * prompts.length); // Fixed index logic
       
        setRandomPrompt(prompts[randomIndex]);
      }
    };

    generateRandomPrompt(action.name);
    // Spring animation to slide in
    translateY.value = withSpring(0, { damping: 15, stiffness: 85 });  // Slide in to 0 with spring effect

      // Make it disappear after 7 seconds
      const timeout = setTimeout(() => {
        translateY.value = withSpring(200, { damping: 15, stiffness: 85 });  // Slide out to off-screen
      }, 5500);  // 7 seconds
  
      // Cleanup timeout on unmount
      return () => clearTimeout(timeout);
  }, [action, friendName]);  // Dependency array ensures useEffect runs when either action or friendName changes

    // Create animated style using the shared value
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: translateY.value }],
      };
    });


  if (!randomPrompt) {
    return <Text>Loading...</Text>;  // Optional: Add a loading state while randomPrompt is null
  }

  return (
    <Animated.View
      style={[
        animatedStyle,]}
      className="
      absolute 
      w-[85%]
      left-[50%]
      -ml-[42.5%]
      p-3 
      bg-[#FAFAFA]
      rounded-[32px] 
      shadow-xs
      bottom-3  
      h-[15%] "
    >
      <TouchableOpacity
      className="
      w-full
      h-full
      flex 
      flex-row 
      items-center 
      justify-start"
      hitSlop={3}>
      <View>
        <Image
          source={randomPrompt.source}
          className="w-14 h-14 mx-4"
          resizeMode="contain"
        />
      </View>
      <View className="flex-1 flex flex-col items-start justify-between flex-wrap">
        <Text className="text-lg font-JakartaSemiBold">{randomPrompt.title}</Text>
        <Text className="text-[14px">{randomPrompt.body}</Text>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ActionPrompts;

