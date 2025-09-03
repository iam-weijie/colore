import React, { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { icons } from "@/constants";
import { usePostCreation } from "@/hooks/usePostCreation";
import { PostCreationUI, PostSettings } from "@/components/new-post";

const EditPost = () => {
  const rawParams = useLocalSearchParams();
  const [selectedSetting, setSelectedSetting] = useState<string>("");
  const [userPosts, setUserPosts] = useState<any[]>([]);

  const {
    // State
    selectedColor,
    selectedEmoji,
    isQuickEmojiSelectorVisible,
    isEmojiSelectorVisible,
    showRecentPopup,
    triggerPosition,
    activeEmojiIndex,
    selectedTab,
    isFocused,
    withdrawKeyboard,
    refreshingKey,
    draftPost,
    userColors,
    shorthandEmojis,
    recentEmojis,
    selectedStaticEmoji,
    isSettingVisible,
    selectedUser,
    selectedRecipientId,
    selectedScheduleDate,
    selectedExpirationDate,
    replyToPostId,
    
    // Setters
    setQuickEmojiSelectorVisible,
    setSelectedStaticEmoji,
    setRefreshingKey,
    setIsSettingVisible,
    setSelectedUser,
    setSelectedRecipientId,
    setSelectedScheduleDate,
    setSelectedExpirationDate,
    setReplyToPostId,
    
    // Handlers
    handleColorSelect,
    handleChangeText,
    handleChangeFormat,
    handleChangeFocus,
    handleEmojiSelect,
    toggleEmojiSelector,
    handleNavigation,
    selectedUserInfo,
  } = usePostCreation({
    postId: rawParams.postId as string,
    content: rawParams.content as string,
    color: rawParams.color as string,
    emoji: rawParams.emoji as string,
    recipientId: rawParams.recipientId as string,
    username: rawParams.username as string,
    expiration: rawParams.expiration as string,
    prompt: rawParams.prompt as string,
    promptId: rawParams.promptId as string,
    boardId: rawParams.boardId as string,
  });

  const navigationControls = [
    {
      icon: icons.back,
      label: "Back",
      onPress: () => handleNavigation('back'),
    },
    {
      icon: selectedTab === "customize" ? icons.send : icons.eraser,
      label: "Save Changes",
      onPress: () => handleNavigation('submit'),
      isCenter: true,
    },
    {
      icon: selectedTab === "customize" ? icons.settings : icons.pencil,
      label: selectedTab === "customize" ? "More" : "Finalize",
      onPress: () => handleNavigation('finalize'),
      isCenter: true,
    },
  ];

  return (
    <>
      <PostCreationUI
        selectedColor={selectedColor}
        selectedEmoji={selectedEmoji}
        isQuickEmojiSelectorVisible={isQuickEmojiSelectorVisible}
        isEmojiSelectorVisible={isEmojiSelectorVisible}
        showRecentPopup={showRecentPopup}
        triggerPosition={triggerPosition}
        activeEmojiIndex={activeEmojiIndex}
        selectedTab={selectedTab}
        isFocused={isFocused}
        withdrawKeyboard={withdrawKeyboard}
        refreshingKey={refreshingKey}
        draftPost={draftPost}
        userColors={userColors}
        shorthandEmojis={shorthandEmojis}
        recentEmojis={recentEmojis}
        selectedStaticEmoji={selectedStaticEmoji}
        handleColorSelect={handleColorSelect}
        handleChangeText={handleChangeText}
        handleChangeFormat={handleChangeFormat}
        handleChangeFocus={handleChangeFocus}
        handleEmojiSelect={handleEmojiSelect}
        toggleEmojiSelector={toggleEmojiSelector}
        setQuickEmojiSelectorVisible={setQuickEmojiSelectorVisible}
        setSelectedStaticEmoji={setSelectedStaticEmoji}
        setRefreshingKey={setRefreshingKey}
        navigationControls={navigationControls}
        postId={rawParams.postId as string}
        prompt={rawParams.prompt as string}
        recipientId={rawParams.recipientId as string}
        username={rawParams.username as string}
      />

      {isSettingVisible && (
        <PostSettings
          selectedSetting={selectedSetting}
          setSelectedSetting={setSelectedSetting}
          userPosts={userPosts}
          setUserPosts={setUserPosts}
          selectedColor={selectedColor}
          selectedUser={selectedUser}
          selectedRecipientId={selectedRecipientId}
          selectedScheduleDate={selectedScheduleDate}
          selectedExpirationDate={selectedExpirationDate}
          promptId={rawParams.promptId as string}
          recipientId={rawParams.recipientId as string}
          boardId={rawParams.boardId as string}
          expiration={rawParams.expiration as string}
          onClose={() => setIsSettingVisible(false)}
          onRecipientSelect={selectedUserInfo}
          onScheduleSelect={(date) => setSelectedScheduleDate(date.toISOString())}
          onExpirationSelect={(date) => setSelectedExpirationDate(date.toISOString())}
          onReplySelect={(id) => setReplyToPostId(id)}
          onRemoveReply={() => setReplyToPostId(null)}
        />
      )}
    </>
  );
};

export default EditPost;

