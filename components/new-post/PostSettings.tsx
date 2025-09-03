import React from "react";
import { View, FlatList, TouchableOpacity, Text } from "react-native";
import { format } from "date-fns";
import { icons } from "@/constants";
import { PostItColor, UserNicknamePair } from "@/types/type";
import ModalSheet from "@/components/Modal";
import ItemContainer from "@/components/ItemContainer";
import PostGallery from "@/components/PostGallery";
import CalendarView from "@/components/CalendarView";
import { FindUser } from "@/components/FindUsers";
import CustomButton from "@/components/CustomButton";
import { useUser } from "@clerk/clerk-expo";
import { useProfileContext } from "@/app/contexts/ProfileContext";

interface PostSettingsProps {
  selectedSetting: string;
  setSelectedSetting: (setting: string) => void;
  userPosts: any[];
  setUserPosts: (posts: any[]) => void;
  selectedColor: PostItColor;
  selectedUser?: UserNicknamePair;
  selectedRecipientId: string;
  selectedScheduleDate: string;
  selectedExpirationDate: string;
  promptId?: string;
  recipientId?: string;
  boardId?: string;
  expiration?: string;
  onClose: () => void;
  onRecipientSelect?: (info: UserNicknamePair) => void;
  onScheduleSelect?: (date: Date) => void;
  onExpirationSelect?: (date: Date) => void;
  onReplySelect?: (id: number) => void;
  onRemoveReply?: () => void;
}

const PostSettings: React.FC<PostSettingsProps> = ({
  selectedSetting,
  setSelectedSetting,
  userPosts,
  setUserPosts,
  selectedColor,
  selectedUser,
  selectedRecipientId,
  selectedScheduleDate,
  selectedExpirationDate,
  promptId,
  recipientId,
  boardId,
  expiration,
  onClose,
  onRecipientSelect,
  onScheduleSelect,
  onExpirationSelect,
  onReplySelect,
  onRemoveReply,
}) => {
  const { user } = useUser();
  const { profile } = useProfileContext();

  // Prevent modal from closing when content changes
  const handleClose = () => {
    // Only close if we're on the main menu
    if (!selectedSetting) {
      onClose();
    } else {
      // Go back to main menu instead of closing
      setSelectedSetting("");
    }
  };

  const allOptions = [
    {
      label: "Recipient",
      component: (
        <ItemContainer
          label={
            selectedUser
              ? selectedUser[1] === profile?.username
                ? "Yourself"
                : selectedUser[1]
              : "Select recipient"
          }
          caption={
            selectedUser
              ? `Sending this to ${selectedUser[1]}`
              : "Add recipient to this post"
          }
          icon={icons.addUser}
          colors={[selectedColor.foldcolorhex, selectedColor.hex]}
          iconColor="#000"
          onPress={() => setSelectedSetting("Recipient")}
          actionIcon={selectedRecipientId && icons.check}
        />
      ),
    },
    {
      label: "Schedule",
      component: (
        <ItemContainer
          label={
            selectedScheduleDate
              ? `Set for ${format(new Date(selectedScheduleDate), "MMMM do")}`
              : "Schedule"
          }
          caption={
            selectedScheduleDate
              ? "Modify scheduled date"
              : "Schedule this post for later."
          }
          icon={icons.chevron}
          colors={[selectedColor.foldcolorhex, selectedColor.hex]}
          iconColor="#000"
          actionIcon={selectedScheduleDate && icons.check}
          onPress={() => setSelectedSetting("Schedule")}
        />
      ),
    },
    {
      label: "Expiration",
      component: (
        <ItemContainer
          label={
            selectedExpirationDate
              ? `Expires on ${format(new Date(selectedExpirationDate), "MMMM do")}`
              : "Expiration"
          }
          caption={
            selectedExpirationDate
              ? "Modify the expiration date"
              : "Set an expiration date for this post"
          }
          icon={icons.timer}
          colors={[selectedColor.foldcolorhex, selectedColor.hex]}
          iconColor="#000"
          actionIcon={selectedExpirationDate && icons.check}
          onPress={() => setSelectedSetting("Expiration")}
        />
      ),
    }
  ];

  const menuOptions = promptId
    ? allOptions.filter((option) => option.label !== "Recipient")
    : !recipientId && !boardId && !expiration
      ? allOptions.filter(
          (option) =>
            option.label !== "Recipient" &&
            option.label !== "Mentions" &&
            option.label !== "Board"
        )
      : recipientId
        ? allOptions.filter((option) => option.label !== "Board")
        : allOptions.filter((option) => option.label !== "Recipient");

  return (
    <ModalSheet
      title="Settings"
      isVisible={true}
      onClose={() => handleClose()}
    >
      <View className="flex-1 h-full px-6">
        {!selectedSetting ? (
          <FlatList
            data={menuOptions}
            keyExtractor={(item, index) => item.label ?? `option-${index}`}
            renderItem={({ item }) => item.component ?? null}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          />
        ) : selectedSetting === "Reply" ? (
          <View className="flex-1">
            <View className="flex-1">
              <PostGallery
                posts={userPosts}
                profileUserId={""}
                disableModal
                handleUpdate={(id: number) => {
                  onReplySelect?.(id);
                  setSelectedSetting("");
                }}
              />
            </View>
            {onRemoveReply && (
              <TouchableOpacity
                onPress={() => {
                  onRemoveReply();
                  setSelectedSetting("");
                }}
                className="w-full mt-4 flex-row items-center justify-center"
              >
                <Text className="text-[14px] font-Jakarta font-regular text-gray-400">
                  Remove reply
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : selectedSetting === "Recipient" ? (
          <View className="flex-1">
            <FindUser
              selectedUserInfo={(item: UserNicknamePair) => {
                onRecipientSelect?.(item);
                setSelectedSetting("");
              }}
            />
          </View>
        ) : ["Schedule", "Expiration"].includes(selectedSetting) ? (
          <View className="flex-1">
            <CalendarView
              color={selectedColor?.hex}
              onDateSelect={
                selectedSetting === "Schedule"
                  ? (selected: Date) => {
                      onScheduleSelect?.(selected);
                      //setSelectedSetting("");
                    }
                  : (selected: Date) => {
                      onExpirationSelect?.(selected);
                      //setSelectedSetting("");
                    }
              }
              selectedDate={ 
                selectedSetting === "Schedule"
                  ? selectedScheduleDate
                    ? new Date(selectedScheduleDate)
                    : null
                  : selectedExpirationDate
                    ? new Date(selectedExpirationDate)
                    : null
              }
              startDate={
                selectedSetting === "Expiration" && selectedScheduleDate
                  ? new Date(selectedScheduleDate)
                  : new Date()
              }
            />
          </View>
        ) : (
          <View className="bg-white flex-1" />
        )}
      </View>

      {selectedSetting === "Recipient" && (
        <View className="flex items-center w-full mb-4">
          <CustomButton
            fontSize="lg"
            title="Keep it Private"
            padding={4}
            bgVariant="gradient"
            onPress={() => {
              if (user && profile) {
                onRecipientSelect?.([user.id, profile.username]);
                setSelectedSetting("");
              }
            }}
          />
        </View>
      )}
      
      {selectedSetting && (
        <View className="flex items-center w-full mb-4">
          <CustomButton
            fontSize="lg"
            title="Close"
            padding={4}
            onPress={() => handleClose()}
          />
        </View>
      )}
    </ModalSheet>
  );
};

export default PostSettings;
