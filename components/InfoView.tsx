import React from "react";
import { ScrollView, View, Text } from "react-native";

interface InfoSection {
  title: string;
  content: string | React.ReactNode;
}

interface InfoPageProps {
  title: string;
  description: string;
  sections: InfoSection[];
  paddingBottom?: number;
}

const InfoPage: React.FC<InfoPageProps> = ({ 
  title, 
  description, 
  sections, 
  paddingBottom = 64 
}) => {
  return (
    <ScrollView 
      contentContainerStyle={{ paddingBottom }} 
      className="px-6 pt-6 bg-white"
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View className="mb-8">
        <Text className="text-2xl font-JakartaBold text-gray-900 mb-3">
          {title}
        </Text>
        <Text className="text-base font-Jakarta text-gray-600 leading-6">
          {description}
        </Text>
      </View>

      {/* Content Sections */}
      {sections.map((section, index) => (
        <View key={index} className="mb-8">
          <Text className="text-lg font-JakartaSemiBold text-gray-800 mb-3">
            {section.title}
          </Text>
          <View className="bg-gray-50 rounded-xl p-5">
            {typeof section.content === 'string' ? (
              <Text className="text-sm font-Jakarta text-gray-700 leading-6">
                {section.content}
              </Text>
            ) : (
              section.content
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// Helper function to create formatted text with bold sections
const createFormattedText = (text: string, boldSections: string[]) => {
  let elements = [];
  let remainingText = text;
  
  boldSections.forEach((boldText, index) => {
    const parts = remainingText.split(boldText);
    
    if (parts[0]) {
      elements.push(parts[0]);
    }
    
    elements.push(
      <Text key={`bold-${index}`} className="font-JakartaSemiBold text-gray-800">
        {boldText}
      </Text>
    );
    
    remainingText = parts.slice(1).join(boldText);
  });
  
  if (remainingText) {
    elements.push(remainingText);
  }
  
  return (
    <Text className="text-sm font-Jakarta text-gray-700 leading-6">
      {elements.map((element, i) => (
        <React.Fragment key={i}>{element}</React.Fragment>
      ))}
    </Text>
  );
};

// Specific page implementations using the unified component
export const SRBInfoPage = () => {
  const sections: InfoSection[] = [
    {
      title: "What is SRB?",
      content: createFormattedText(
        "Each mascot represents a core type of interaction: Steve (Blue) — Grows when you make or receive posts. Rosie (Pink) — Grows with post customization. Bob (Yellow) — Grows when your posts get likes and comments. Try mixing your SRB stats up to 3 times a day using the Attempt Create Color button!",
        ["Steve (Blue)", "Rosie (Pink)", "Bob (Yellow)", "3 times a day", "Attempt Create Color"]
      )
    },
    {
      title: "How Each Level Grows",
      content: createFormattedText(
        "Blue Level: +1 point for every 5 posts (sent or received). Pink Level: Customize your posts (emoji, color, formatting). → Level up = Current Level × 3 customization actions. Yellow Level: Gain likes and comments. → 10 likes + 10 comments = +1 level.",
        ["Blue Level", "Pink Level", "Yellow Level"]
      )
    },
    {
      title: "Key Features",
      content: createFormattedText(
        "View Color Library: See all the colors you've unlocked. ✨ Attempt Create Color: Try mixing SRB values to discover new ones.",
        ["View Color Library", "Attempt Create Color"]
      )
    }
  ];

  return (
    <InfoPage
      title="SRB Progression"
      description="SRB stands for Steve, Rosie, and Bob — our app mascots and your guides to unlocking new colors in Coloré."
      sections={sections}
      paddingBottom={184}
    />
  );
};

export const InformationInfoPage = () => {
  const sections: InfoSection[] = [
    {
      title: "Username",
      content: "This is your public-facing name. It's visible to everyone on the app, including users who aren't your friends."
    },
    {
      title: "Nickname",
      content: "This name is only visible to your friends. It's used for interactions like sharing posts or visiting a profile. This is also the name used when sending friend requests."
    },
    {
      title: "Incognito Name",
      content: "Want to stay anonymous even among friends? Set an incognito name. It'll replace your username and nickname in comments and prompts to protect your identity."
    },
    {
      title: "Email",
      content: "This is the email we'll use for account recovery and occasional promotional updates."
    },
    {
      title: "Location",
      content: "Your location is used to help you discover region-specific posts and connect with your local community."
    }
  ];

  return (
    <InfoPage
      title="Profile Information"
      description="This section shows the core identity details of your Coloré profile. Some fields are public, while others help you personalize your experience or stay private."
      sections={sections}
    />
  );
};

export const YourActivityInfoPage = () => {
  const sections: InfoSection[] = [
    {
      title: "Saved Notes",
      content: "To save a post, tap the menu on any post and select 'Save'. You can remove saved posts the same way. All saved content shows up here."
    },
    {
      title: "Liked Notes",
      content: "Every post you've ever liked will appear here. Revisit what resonated with you the most, anytime."
    },
    {
      title: "Quick Reaction Emojis",
      content: "Quick Reaction Emojis are shortcuts that appear when you create a post. Customize your favorites for faster expression."
    }
  ];

  return (
    <InfoPage
      title="Your Activity"
      description="This section keeps track of the ways you interact with content inside Coloré. Save, like, or customize — your actions live here."
      sections={sections}
    />
  );
};

export const PreferencesInfoPage = () => {
  const sections: InfoSection[] = [
    {
      title: "Haptic Feedback",
      content: "These are the soft vibrations that give your taps a tactile feel. If you'd rather not feel them, just turn it off."
    },
    {
      title: "Sound Effects",
      content: "Coloré includes playful sounds to enhance interaction. Make sure your ringer is on to hear them, or disable them for silence."
    }
  ];

  return (
    <InfoPage
      title="Preferences"
      description="Personalize how Coloré feels. Choose whether to feel or hear your interactions — it's all up to you."
      sections={sections}
    />
  );
};

export default InfoPage;