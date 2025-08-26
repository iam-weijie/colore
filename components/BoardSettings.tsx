import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { icons } from "@/constants";
import { Board } from "@/types/type";
import { DetailRow, HeaderCard, ToggleRow } from "@/components/CardInfo";
import ItemContainer from "@/components/ItemContainer";
import CustomButton from "@/components/CustomButton";
import EmptyListView from "@/components/EmptyList";
import { FindUser } from "@/components/FindUsers";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface BoardSettingsProps {
  boardInfo: Board | undefined;
  isOwnBoard: boolean;
  boardId: string | string[];
  username: string | string[];
  postCount: number;
  joinedCommunity: boolean;
  canComment: boolean;
  onSettingSelect: (setting: string) => void;
  onJoinCommunity: () => void;
  onDeleteBoard: () => void;
  onUpdatePermissions: (restrictions: string[]) => Promise<void>;
  onRenameBoard: () => void;
}

export const BoardSettings: React.FC<BoardSettingsProps> = ({
  boardInfo,
  isOwnBoard,
  boardId,
  username,
  postCount,
  joinedCommunity,
  canComment,
  onSettingSelect,
  onJoinCommunity,
  onDeleteBoard,
  onUpdatePermissions,
  onRenameBoard,
}) => {
  const { hapticsEnabled, setHapticsEnabled, soundEffectsEnabled, setSoundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects();

  const handleHapticsToggle = (value: boolean) => {
    setHapticsEnabled(value);
    playSoundEffect(value ? SoundType.ToggleOn : SoundType.ToggleOff);
  };

  const handleSoundToggle = (value: boolean) => {
    setSoundEffectsEnabled(value);
    playSoundEffect(value ? SoundType.ToggleOn : SoundType.ToggleOff);
  };

  const handleDeleteBoard = () => {
    Alert.alert(
      "Delete Board",
      "Are you sure you want to delete this board? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDeleteBoard }
      ]
    );
  };

  const allOptions = [
    {
      label: "Name",
      role: "admin",
      component: (
        <ItemContainer
          label={"Edit Name"}
          caption={"Modify this board's name."}
          icon={icons.pencil}
          colors={["#CFB1FB", "#fef08a"]}
          iconColor="#000"
          onPress={onRenameBoard}
        />
      ),
    },
    {
      label: "Permissions",
      role: "admin",
      component: (
        <ItemContainer
          label={"Edit Board Permissions"}
          caption={"Modify this board's permissions."}
          icon={icons.hide}
          colors={["#CFB1FB", "#fef08a"]}
          iconColor="#000"
          onPress={() => onSettingSelect("Permissions")}
        />
      ),
    },
    {
      label: "Delete",
      role: "admin",
      component: (
        <ItemContainer
          label={"Delete Board"}
          caption={"Delete this board"}
          icon={icons.trash}
          colors={["#CFB1FB", "#fef08a"]}
          iconColor="#000"
          onPress={handleDeleteBoard}
        />
      ),
    },
    {
      label: "Membership",
      role: "",
      component: (
        <ItemContainer
          label={joinedCommunity ? "Wanna leave?" : "Wanna join?"}
          caption={
            joinedCommunity ? "Leave this community." : "Join this community."
          }
          icon={joinedCommunity ? icons.close : icons.add}
          colors={["#CFB1FB", "#fef08a"]}
          iconColor="#000"
          onPress={onJoinCommunity}
        />
      ),
    },
    {
      label: "Members",
      role: "",
      component: (
        <ItemContainer
          label={"See Members"}
          caption={"View the members of this board."}
          icon={icons.addUser}
          colors={["#CFB1FB", "#fef08a"]}
          iconColor="#000"
          onPress={() => onSettingSelect("Members")}
        />
      ),
    },
    {
      label: "Info",
      role: "",
      component: (
        <ItemContainer
          label={"Show Board Info"}
          caption={"View this board's information."}
          icon={icons.info}
          colors={["#CFB1FB", "#fef08a"]}
          iconColor="#000"
          onPress={() => onSettingSelect("Info")}
        />
      ),
    },
  ];

  const menuOptions =
    isOwnBoard && boardId == "-1"
      ? allOptions.filter((option) => option.role == "admin")
      : (isOwnBoard ? allOptions.filter((option) => option.label !== "Membership") : allOptions.filter((option) => option.role !== "admin"));

  return (
    <FlatList
      data={menuOptions}
      keyExtractor={(item, index) => item.label ?? `option-${index}`}
      ListEmptyComponent={
        <EmptyListView message={"No options? Weird..."} character="steve" mood={0} />
      }
      renderItem={({ item, index }) => {
        return (
          <View>
            {item.role == "admin" ? 
              (index > 0 && menuOptions[index - 1].role === item.role ? <></> : <Text className="text-center text-[14px] font-JakartaMedium ml-4 text-gray-300">Edit</Text>)
              : (index > 0 && menuOptions[index - 1].role === item.role ? <></> : <Text className="text-center  text-[14px] font-JakartaMedium ml-4 text-gray-300">Interact</Text>)}
            {item.component}
          </View>
        );
      }}
      contentContainerStyle={{ paddingBottom: 80, marginBottom: 16 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default BoardSettings;
