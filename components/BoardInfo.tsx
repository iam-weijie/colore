import React from "react";
import {
  View,
  Text,
  ScrollView,
} from "react-native";
import { DetailRow, HeaderCard, ToggleRow } from "@/components/CardInfo";
import CustomButton from "@/components/CustomButton";
import { Board } from "@/types/type";
import { formatDateWithMonth, formatTime } from "@/lib/utils";

interface BoardInfoProps {
  boardInfo: Board | undefined;
  username: string | string[];
  postCount: number;
  hapticsEnabled: boolean;
  soundEffectsEnabled: boolean;
  onHapticsToggle: (value: boolean) => void;
  onSoundToggle: (value: boolean) => void;
  onClose: () => void;
}

export const BoardInfo: React.FC<BoardInfoProps> = ({
  boardInfo,
  username,
  postCount,
  hapticsEnabled,
  soundEffectsEnabled,
  onHapticsToggle,
  onSoundToggle,
  onClose,
}) => {
  const getBoardRestrictionDisplay = (restrictions: string[], boardType: string) => {
    const displayMap: { [key: string]: string } = {};
    
    restrictions.forEach(restriction => {
      switch (restriction) {
        case "Private":
          displayMap.privacy = "Private";
          break;
        case "Everyone":
          displayMap.privacy = "Public";
          break;
        case "commentsAllowed":
          displayMap.comments = "Allowed";
          break;
        case "commentsDisabled":
          displayMap.comments = "Disabled";
          break;
        case "invite-needed":
          displayMap.visibility = "Invite Only";
          break;
        case "public":
          displayMap.visibility = "Public";
          break;
        case "location-needed":
          displayMap.location = "Required";
          break;
        case "no-location":
          displayMap.location = "Not Required";
          break;
      }
    });
    
    return displayMap;
  };

  const getBoardRestrictionSummary = (restrictions: string[], boardType: string) => {
    const display = getBoardRestrictionDisplay(restrictions, boardType);
    const summary = [];
    
    if (display.privacy) summary.push(display.privacy);
    if (display.comments) summary.push(`Comments: ${display.comments}`);
    if (boardType !== "personal") {
      if (display.visibility) summary.push(display.visibility);
      if (display.location) summary.push(`Location: ${display.location}`);
    }
    
    return summary.join(" • ");
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ height: 800 }}
      className="flex-1"
    >
      <HeaderCard
        title="Information"
        color="#93c5fd"
        content={
          <>
            <DetailRow
              label="Title"
              value={boardInfo?.title || username || "Untitled"}
              onPress={null}
              accentColor="#93c5fd"
            />
            <DetailRow 
              label="Type" 
              value={boardInfo?.board_type === "personal" ? "Personal Board" : "Community Board"} 
              onPress={null}
              accentColor="#93c5fd"
            />
            <DetailRow 
              label="Created" 
              value={boardInfo?.created_at ? formatDateWithMonth(new Date(boardInfo.created_at).toLocaleDateString()) : "Unknown"} 
              onPress={null}
              accentColor="#93c5fd"
            />
            <DetailRow 
              label="Posts" 
              value={`${postCount}`} 
              onPress={null}
              accentColor="#93c5fd"
            />
            <DetailRow 
              label="Members" 
              value={`${boardInfo?.members_id?.length || 0}`} 
              onPress={null}
              accentColor="#93c5fd"
            />
          </>
        }
        infoView={null}
      />
      
      <View className="my-4"></View>
      
      <HeaderCard 
        title="Board Settings" 
        color="#ffe640"
        content={
          <>
            <DetailRow
              label="Privacy"
              value={boardInfo?.restrictions?.includes("Private") ? "Private" : "Public"}
              onPress={null}
              accentColor="#ffe640"
            />
            <DetailRow
              label="Comments"
              value={boardInfo?.restrictions?.includes("commentsAllowed") ? "Allowed" : "Disabled"}
              onPress={null}
              accentColor="#ffe640"
            />
            {boardInfo?.board_type !== "personal" && (
              <>
                <DetailRow
                  label="Visibility"
                  value={boardInfo?.restrictions?.includes("invite-needed") ? "Invite Only" : "Public"}
                  onPress={null}
                  accentColor="#ffe640"
                />
                <DetailRow
                  label="Location Access"
                  value={boardInfo?.restrictions?.includes("location-needed") ? "Required" : "Not Required"}
                  onPress={null}
                  accentColor="#ffe640"
                />
              </>
            )}
          </>
        }
        infoView={null}
      />
      
      <View className="my-4"></View>
      <View className="flex-1 flex items-center w-full mb-4">
        <CustomButton
          className="my-2 w-[175px] h-14 self-center rounded-full shadow-none bg-black"
          fontSize="lg"
          title="Close"
          padding={4}
          onPress={onClose}
        />
      </View>
      <View className="my-4"></View>
    </ScrollView>
  );
};

export default BoardInfo;
