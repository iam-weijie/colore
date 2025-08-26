import React from "react";
import {
  View,
} from "react-native";
import ModalSheet from "@/components/Modal";
import { FindUser } from "@/components/FindUsers";
import BoardInfo from "./BoardInfo";
import BoardPermissionsEditor from "./BoardPermissionsEditor";
import BoardSettings from "./BoardSettings";
import { Board } from "@/types/type";
import CustomButton from "./CustomButton";

interface BoardSettingsModalProps {
  isVisible: boolean;
  selectedSetting: string;
  boardInfo: Board | undefined;
  username: string | string[];
  postCount: number;
  hapticsEnabled: boolean;
  soundEffectsEnabled: boolean;
  isOwnBoard: boolean;
  boardId: string | string[];
  joinedCommunity: boolean;
  canComment: boolean;
  onClose: () => void;
  onSettingSelect: (setting: string) => void;
  onHapticsToggle: (value: boolean) => void;
  onSoundToggle: (value: boolean) => void;
  onUpdatePermissions: (restrictions: string[]) => Promise<void>;
  onJoinCommunity: () => void;
  onDeleteBoard: () => void;
  onRenameBoard: () => void;
}

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({
  isVisible,
  selectedSetting,
  boardInfo,
  username,
  postCount,
  hapticsEnabled,
  soundEffectsEnabled,
  isOwnBoard,
  boardId,
  joinedCommunity,
  canComment,
  onClose,
  onSettingSelect,
  onHapticsToggle,
  onSoundToggle,
  onUpdatePermissions,
  onJoinCommunity,
  onDeleteBoard,
  onRenameBoard,
}) => {
  const renderContent = () => {
    switch (selectedSetting) {
      case "Share":
        return (
          <View 
            className="flex-1 my-2"
            style={{ height: 600 }}
          >
            <FindUser selectedUserInfo={() => {}} />
          </View>
        );
      
      case "Members":
        return (
            <View className="flex-1" style={{ minHeight: 500 }}>
              <View className="flex-1 min-h-0">
                <FindUser
                  selectedUserInfo={() => {}}
                  inGivenList={boardInfo?.members_id}
                />
              </View>
              <View className="items-center w-full pb-4 pt-2">
                <CustomButton
                  className="my-2 w-[175px] h-14 self-center rounded-full shadow-none bg-black"
                  fontSize="lg"
                  title="Close"
                  padding={4}
                  onPress={() => onSettingSelect("")}
                />
              </View>
            </View>
        );
      
      case "Info":
        return (
          <BoardInfo
            boardInfo={boardInfo}
            username={username}
            postCount={postCount}
            hapticsEnabled={hapticsEnabled}
            soundEffectsEnabled={soundEffectsEnabled}
            onHapticsToggle={onHapticsToggle}
            onSoundToggle={onSoundToggle}
            onClose={() => onSettingSelect("")}
          />
        );
      
      case "Permissions":
        return (
          <BoardPermissionsEditor
            boardInfo={boardInfo}
            onSave={onUpdatePermissions}
            onClose={() => onSettingSelect("")}
          />
        );
      
      default:
        return (
          <BoardSettings
            boardInfo={boardInfo}
            isOwnBoard={isOwnBoard}
            boardId={boardId}
            username={username}
            postCount={postCount}
            joinedCommunity={joinedCommunity}
            canComment={canComment}
            onSettingSelect={onSettingSelect}
            onJoinCommunity={onJoinCommunity}
            onDeleteBoard={onDeleteBoard}
            onUpdatePermissions={onUpdatePermissions}
            onRenameBoard={() => {
              onRenameBoard()
              onClose()}
          }
          />
        );
    }
  };

  return (
    <ModalSheet
      title={!selectedSetting ? "Board Settings" : selectedSetting}
      isVisible={isVisible}
      onClose={onClose}
    >
      <View className="flex-1 px-6 py-4 justify-center">
        {renderContent()}
      </View>
    </ModalSheet>
  );
};

export default BoardSettingsModal;
