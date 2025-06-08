import React from "react";
import { ScrollView, View, Text } from "react-native";

export const SRBInfoPage = () => {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 184 }} className="px-8 pt-4 bg-transparent">
      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">
          SRB Progression
        </Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          SRB stands for <Text className="font-JakartaMedium">Steve</Text>, <Text className="font-JakartaMedium">Rosie</Text>, and <Text className="font-JakartaMedium">Bob</Text> — our app mascots and your guides to unlocking new colors in Coloré.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">What is SRB?</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          Each mascot represents a core type of interaction:
          {"\n\n"} <Text className="font-JakartaMedium">Steve (Blue)</Text> — Grows when you make or receive posts.
          {"\n"}<Text className="font-JakartaMedium">Rosie (Pink)</Text> — Grows with post customization.
          {"\n"}<Text className="font-JakartaMedium">Bob (Yellow)</Text> — Grows when your posts get likes and comments.
          {"\n\n"}Try mixing your SRB stats up to <Text className="font-JakartaMedium">3 times a day</Text> using the <Text className="font-JakartaMedium">Attempt Create Color</Text> button!
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">How Each Level Grows</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          <Text className="font-JakartaMedium">Blue Level</Text>: +1 point for every 5 posts (sent or received).
          {"\n\n"}<Text className="font-JakartaMedium">Pink Level</Text>: Customize your posts (emoji, color, formatting).
          {"\n"}→ Level up = Current Level × 3 customization actions.
          {"\n\n"}<Text className="font-JakartaMedium">Yellow Level</Text>: Gain likes and comments.
          {"\n"}→ 10 likes + 10 comments = +1 level.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Key Features</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          <Text className="font-JakartaMedium">View Color Library</Text>: See all the colors you've unlocked.
          {"\n"}✨ <Text className="font-JakartaMedium">Attempt Create Color</Text>: Try mixing SRB values to discover new ones.
        </Text>
      </View>
    </ScrollView>
  );
};

export const InformationInfoPage = () => {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 64 }} className="px-8 pt-6 bg-transparent">
      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">
          Profile Information
        </Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          This section shows the core identity details of your Coloré profile. Some fields are public, while others help you personalize your experience or stay private.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Username</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          This is your public-facing name. It’s visible to everyone on the app, including users who aren’t your friends.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Nickname</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          This name is only visible to your friends. It’s used for interactions like sharing posts or visiting a profile. This is also the name used when sending friend requests.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Incognito Name</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          Want to stay anonymous even among friends? Set an incognito name. It'll replace your username and nickname in comments and prompts to protect your identity.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Email</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          This is the email we’ll use for account recovery and occasional promotional updates.
        </Text>
      </View>

      <View>
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Location</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          Your location is used to help you discover region-specific posts and connect with your local community.
        </Text>
      </View>
    </ScrollView>
  );
};

export const YourActivityInfoPage = () => {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 64 }} className="px-8 pt-6 bg-transparent">
      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">
          Your Activity
        </Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          This section keeps track of the ways you interact with content inside Coloré. Save, like, or customize — your actions live here.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Saved Posts</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          To save a post, tap the menu on any post and select “Save”. You can remove saved posts the same way. All saved content shows up here.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Liked Posts</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          Every post you've ever liked will appear here. Revisit what resonated with you the most, anytime.
        </Text>
      </View>

      <View>
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Quick Reaction Emojis</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          Quick Reaction Emojis are shortcuts that appear when you create a post. Customize your favorites for faster expression.
        </Text>
      </View>
    </ScrollView>
  );
};

export const PreferencesInfoPage = () => {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 64 }} className="px-8 pt-6 bg-transparent">
      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">
          Preferences
        </Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          Personalize how Coloré feels. Choose whether to feel or hear your interactions — it's all up to you.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Haptic Feedback</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          These are the soft vibrations that give your taps a tactile feel. If you’d rather not feel them, just turn it off.
        </Text>
      </View>

      <View>
        <Text className="text-[14px] font-JakartaSemiBold mb-2">Sound Effects</Text>
        <Text className="text-[12px] font-Jakarta text-tray-600 leading-[22px]">
          Coloré includes playful sounds to enhance interaction. Make sure your ringer is on to hear them, or disable them for silence.
        </Text>
      </View>
    </ScrollView>
  );
};