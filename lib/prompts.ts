import { fetchAPI } from "@/lib/fetch";

import { ImageSourcePropType } from "react-native";
import bob from "@/assets/characters/bob-1.png";
import steve from "@/assets/characters/steve-annoyed-1.png";
import rosie from "@/assets/characters/rosie-1.png";


// ENUM

export const ActionType = Object.freeze({
  NONE: { name: "none" },
  EMPTY: { name: "empty" },
  WHILEAGO: { name: "whileago" },
  RECIPROCITY: { name: "reciprocity" },
  TIPS: { name: "tips" }
});

// PROMPTS

const actionPrompts = {
  none: (friendName) => [
    {
      title: "No action yet",
      body: `Well, ${friendName}, the board's as empty as my patience for waiting. Do something already!`,
      source: rosie
    },
    {
      title: "Quiet moment",
      body: `It's unusually quiet, ${friendName}. Historically, silence precedes chaos... just saying.`,
      source: steve
    },
    {
      title: "Random thought",
      body: `Hey ${friendName}, why not drop the most unhinged thought you've had today?`,
      source: bob
    },
    {
      title: "The board awaits",
      body: `The board is waiting, ${friendName}. Maybe set it on fire—with words, of course.`,
      source: bob
    },
    {
      title: "Say hello",
      body: `An empty board, ${friendName}? How academically unproductive. At least say hello.`,
      source: steve
    }
  ],
  empty: (friendName) => [
    {
      title: "Empty board",
      body: `Wow, ${friendName}. Not a single post? Must be an avant-garde expression of minimalism.`,
      source: rosie
    },
    {
      title: "Fill the blank",
      body: `Hey, ${friendName}, this board is so empty, I almost want to graffiti it myself.`,
      source: bob
    },
    {
      title: "Brighten their day",
      body: `Why not drop a message for ${friendName}? Even a genius needs a distraction now and then.`,
      source: steve
    },
    {
      title: "Canvas for you",
      body: `It's a blank slate, ${friendName}. Try not to mess it up—too much.`,
      source: rosie
    },
    {
      title: "Compliment time",
      body: `This board is begging for chaos, ${friendName}. Go wild. Compliments or calamity—your choice.`,
      source: bob
    }
  ],
  whileago: (friendName) => [
    {
      title: "Long time no post",
      body: `Wow, ${friendName}, it's been so long I thought this board was in hibernation.`,
      source: rosie
    },
    {
      title: "Catch up",
      body: `${friendName}, it's been ages! Unless time travel is involved, you've got some catching up to do.`,
      source: steve
    },
    {
      title: "Make their day",
      body: `It's been a while, ${friendName}. Drop a message and disrupt the peace.`,
      source: bob
    },
    {
      title: "Time flies",
      body: `Time flies, ${friendName}. Imagine all the intellectual revelations you've missed here!`,
      source: steve
    },
    {
      title: "Reconnect",
      body: `Leave a message, ${friendName}. Maybe remind them you're still alive or something.`,
      source: rosie
    }
  ],
  reciprocity: (friendName) => [
    {
      title: "Your turn to reply",
      body: `${friendName} reached out! Your turn—don’t make it awkward.`,
      source: rosie
    },
    {
      title: "Show some love",
      body: `${friendName} made an effort. Basic etiquette suggests a reply, you know.`,
      source: steve
    },
    {
      title: "Fun reply",
      body: `Oh, ${friendName} posted? Time to respond with something outrageous—make it memorable!`,
      source: bob
    },
    {
      title: "Support their post",
      body: `${friendName} took the first step. Don't let them regret it.`,
      source: rosie
    },
    {
      title: "Share back",
      body: `${friendName} shared something. Reciprocation—an elementary social concept, really.`,
      source: steve
    }
  ],
  tips: () => [
    {
      title: "Stacking Post-its",
      body: `Try stacking post-its for a chaotic collage effect—like a tornado of thoughts!`,
      source: bob
    },
    {
      title: "Quick Stack",
      body: `Hold the background for 2 seconds to stack all post-its. It's efficient, unlike most things you do.`,
      source: rosie
    },
    {
      title: "Save for later!",
      body: `To save a post, click the '...' and hit save. Revolutionary, right?`,
      source: steve
    }
  ]
};


// FUNCTIONS

export const generateRandomPrompt = (actionName: string, friendName: string) => {
  const prompts = actionPrompts[actionName.toLowerCase()](friendName);

  if (prompts && prompts.length > 0) {
    const randomIndex = Math.floor(Math.random() * prompts.length); 
   
    return prompts[randomIndex]
  }
};
