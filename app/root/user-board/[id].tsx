import {
  View,
  Dimensions,
  Alert,
} from "react-native";
import PersonalBoard from "@/components/PersonalBoard";
import { useLocalSearchParams } from "expo-router";
import { icons } from "@/constants";
import { router } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useAlert } from "@/notifications/AlertContext";
import { useUser } from "@clerk/clerk-expo";
import Header from "@/components/Header";
import { CustomButtonBar } from "@/components/CustomTabBar";
import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import { Post, Board } from "@/types/type";
import PostModal from "@/components/PostModal";
import { useDecrypt } from "@/hooks/useDecrypt";
import RenameContainer from "@/components/RenameContainer";
import KeyboardOverlay from "@/components/KeyboardOverlay";
import BoardSettingsModal from "@/components/BoardSettingsModal";
import BoardHeader from "@/components/BoardHeader";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const UserPersonalBoard = () => {
  // All hooks must be called at the top level, never conditionally
  const { user } = useUser();
  const { id, username, boardId, postId, commentId } = useLocalSearchParams();
  const { playSoundEffect } = useSoundEffects();
  const decrypt = useDecrypt();
  const {
    hapticsEnabled,
    setHapticsEnabled,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
  } = useSettingsContext();
  const { encryptionKey } = useEncryptionContext();
  const { showAlert } = useAlert();

  // State declarations
  const [onFocus, setOnFocus] = useState<boolean>(false);
  const [isBoardSettingsVisible, setIsBoardSettingsVisible] = useState<boolean>(false);
  const [selectedSetting, setSelectedSetting] = useState<string>("");
  const [shuffleMode, setShuffleMode] = useState<boolean>(false);
  const [boardInfo, setBoardInfo] = useState<Board | undefined>();
  const [post, setPost] = useState<Post>();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [postCount, setPostCount] = useState<number>(0);
  const [joinedCommunity, setJoinedCommunity] = useState<boolean>(false);
  const [canParticipate, setCanParticipate] = useState<boolean>(false);
  const [canComment, setCanComment] = useState<boolean>(true);

  // Computed values
  const isOwnBoard = !id || id == user?.id;

  // Event handlers
  const handleNewPost = useCallback(() => {
    router.push({
      pathname: "/root/new-post",
      params: {
        recipient_id: id,
        username: username,
        boardId: boardId,
        source: "board",
      },
    });
  }, [id, username, boardId]);

  const handleHapticsToggle = useCallback((value: boolean) => {
    setHapticsEnabled(value);
    playSoundEffect(value ? SoundType.ToggleOn : SoundType.ToggleOff);
  }, [setHapticsEnabled, playSoundEffect]);

  const handleSoundToggle = useCallback((value: boolean) => {
    setSoundEffectsEnabled(value);
    playSoundEffect(value ? SoundType.ToggleOn : SoundType.ToggleOff);
  }, [setSoundEffectsEnabled, playSoundEffect]);

  const fetchNewPost = useCallback(async (id: string) => {
    try {
      const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`);
      const post = response.data;

      if (!post || post.length === 0) {
        return null;
      }
      setTimeout(() => {
        setPost(post[0]);
        setIsModalVisible(true);
      }, 800);
    } catch (error) {
      return null;
    }
  }, []);

  const fetchBoard = useCallback(async () => {
    if (boardId == "-1" || username == "Personal Board") return;
    try {
      const response = await fetchAPI(`/api/boards/getBoardById?id=${boardId}`);
      
      if (!response.data) {
        console.error("Board data is undefined");
        showAlert({
          title: 'Error',
          message: `Could not load board information`,
          type: 'ERROR',
          status: 'error',
        });
        return;
      }

      const isPrivate = response.data.board_type == "personal";

      let boardData = response.data;
      if (isPrivate && encryptionKey) {
        try {
          boardData = {
            ...boardData,
            title: decrypt(boardData.title),
            description: decrypt(boardData.description),
          };
        } catch {}
      }

      setBoardInfo(boardData);
      setCanParticipate(!isPrivate);
      setCanComment(boardData.restrictions.includes("commentsAllowed"));
      setPostCount(response.count || 0);

      const hasJoined = response.data.members_id && response.data.members_id.includes(user!.id);
      setJoinedCommunity(hasJoined);
    } catch (error) {
      console.error("Failed to fetch board", error);
      showAlert({
        title: 'Error',
        message: `Failed to load board`,
        type: 'ERROR',
        status: 'error',
      });
    }
  }, [boardId, username, encryptionKey, decrypt, showAlert, user]);

  const handleJoinCommunity = useCallback(async () => {
    const response = await fetchAPI(`/api/boards/handleJoiningCommunityBoard`, {
      method: "PATCH",
      body: JSON.stringify({
        clerkId: user!.id,
        boardId: boardId,
        isJoining: !joinedCommunity,
      }),
    });

    if (response.data[0].user_id != user!.id) {
      if (!joinedCommunity) {
        setJoinedCommunity(true);
        showAlert({
          title: "Success",
          message: `You've joined the community.`,
          type: "SUCCESS",
          status: "success",
        });
      } else {
        setJoinedCommunity(false);
      }
    }

    if (!response.success) {
      showAlert({
        title: "Error",
        message: `You cannot leave a community you created.`,
        type: "ERROR",
        status: "error",
      });
    }
  }, [user, boardId, joinedCommunity, showAlert]);

  const handleNewBoardTitle = useCallback(async (name: string) => {
    try {
      const response = await fetchAPI(`/api/boards/updateBoard`, {
        method: 'PATCH',
        body: JSON.stringify({
          userId: user!.id,
          boardId: boardId,
          title: name
        })
      });

      if (response.success) {
        setBoardInfo(prev => prev ? { ...prev, title: name } : prev);
        setOnFocus(false);
        
        showAlert({
          title: "Success",
          message: "Board title updated successfully",
          type: "SUCCESS",
          status: "success",
        });
      } else {
        throw new Error(response.error || "Failed to update board title");
      }
    } catch (error) {
      console.error('Failed to update board title', error);
      showAlert({
        title: "Error",
        message: "Failed to update board title. Please try again.",
        type: "ERROR",
        status: "error",
      });
    }
  }, [user, boardId, showAlert]);

  const handleDeleteBoard = useCallback(async () => {
    try {
      const response = await fetchAPI(`/api/boards/deleteBoard`, {
        method: 'DELETE',
        body: JSON.stringify({
          userId: user!.id,
          boardId: boardId
        })
      });

      if (response.success) {
        showAlert({
          title: "Success",
          message: "Board deleted successfully",
          type: "SUCCESS",
          status: "success",
        });
        
        router.push('/root/tabs/personal-board');
      } else {
        throw new Error(response.error || "Failed to delete board");
      }
    } catch (error) {
      console.error('Failed to delete board', error);
      showAlert({
        title: "Error",
        message: "Failed to delete board. Please try again.",
        type: "ERROR",
        status: "error",
      });
    }
  }, [user, boardId, showAlert]);

  const handleUpdateBoardPermissions = useCallback(async (newRestrictions: string[]) => {
    try {
      const response = await fetchAPI(`/api/boards/updateBoardPermissions`, {
        method: 'PATCH',
        body: JSON.stringify({
          userId: user!.id,
          boardId: boardId,
          restrictions: newRestrictions
        })
      });

      if (response.success) {
        setBoardInfo(prev => prev ? { ...prev, restrictions: newRestrictions } : prev);
        setCanComment(newRestrictions.includes("commentsAllowed"));
        
        showAlert({
          title: "Success",
          message: "Board permissions updated successfully",
          type: "SUCCESS",
          status: "success",
        });
      } else {
        throw new Error(response.error || "Failed to update board permissions");
      }
    } catch (error) {
      console.error('Failed to update board permissions', error);
      showAlert({
        title: "Error",
        message: "Failed to update board permissions. Please try again.",
        type: "ERROR",
        status: "error",
      });
    }
  }, [user, boardId, showAlert]);

  const handleSettingSelect = useCallback((setting: string) => {
    setSelectedSetting(setting);
  }, []);

  const handleRenameBoard = useCallback(() => {
    setIsBoardSettingsVisible(false)
    setSelectedSetting("")

    setTimeout(() => {
      setOnFocus(true);
    }, 250)
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsBoardSettingsVisible(false);
    setSelectedSetting("");
  }, []);

  // Navigation controls
  const navigationControls = useMemo(() => {
    if (isOwnBoard || boardId == "-1") {
      return [
        {
          icon: icons.back,
          label: "Back",
          onPress: () => router.back(),
        },
        {
          icon: icons.pencil,
          label: "New Post",
          onPress: handleNewPost,
          isCenter: true,
        },
        {
          icon: icons.settings,
          label: "Settings",
          onPress: () => setIsBoardSettingsVisible(true),
        },
      ];
    } else {
      return [
        {
          icon: icons.back,
          label: "Back",
          onPress: () => router.back(),
        },
        {
          icon: icons.shuffle,
          label: "Shuffle",
          onPress: () => setShuffleMode(true),
          isCenter: true,
        },
        {
          icon: icons.settings,
          label: "Settings",
          onPress: () => setIsBoardSettingsVisible(true),
        },
      ];
    }
  }, [isOwnBoard, boardId, handleNewPost]);

  // Effects
  useEffect(() => {
    fetchBoard();
  }, [fetchBoard, joinedCommunity]);

  useEffect(() => {
    if (postId && typeof postId === 'string') {
      fetchNewPost(postId);
    }
  }, [postId, fetchNewPost]);

  return (
    <>
      <View className="flex-1 bg-[#FAFAFA]">
        <LinearGradient
          colors={["#FAFAFA", "#FAFAFA"]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          className="absolute w-full h-full inset-0 z-0"
        />

        <Header
          item={
            <BoardHeader
              username={username}
              boardInfo={boardInfo}
              postCount={postCount}
              isOwnBoard={isOwnBoard}
            />
          }
        />

        <PersonalBoard
          userId={id as string}
          boardId={Number(boardId)}
          shuffleModeOn={shuffleMode}
          setShuffleModeOn={() => setShuffleMode(false)}
          restrictions={{ allowedComments: canComment }}
        />
        
        <CustomButtonBar buttons={navigationControls} />
        
        {isBoardSettingsVisible && Number(boardId) > 0 && (
          <BoardSettingsModal
            isVisible={isBoardSettingsVisible}
            selectedSetting={selectedSetting}
            boardInfo={boardInfo}
            username={username}
            postCount={postCount}
            hapticsEnabled={hapticsEnabled}
            soundEffectsEnabled={soundEffectsEnabled}
            isOwnBoard={isOwnBoard}
            boardId={boardId}
            joinedCommunity={joinedCommunity}
            canComment={canComment}
            onClose={handleCloseSettings}
            onSettingSelect={handleSettingSelect}
            onHapticsToggle={handleHapticsToggle}
            onSoundToggle={handleSoundToggle}
            onUpdatePermissions={handleUpdateBoardPermissions}
            onJoinCommunity={handleJoinCommunity}
            onDeleteBoard={handleDeleteBoard}
            onRenameBoard={handleRenameBoard}
          />
        )}
      </View>

      {post && (
        <PostModal
          isVisible={!!post}
          selectedPosts={post ? [post] : []}
          handleCloseModal={() => {
            setIsModalVisible(false);
            setPost(undefined);
          }}
          seeComments={!!commentId}
        />
      )}

      {onFocus && (
        <KeyboardOverlay onFocus={onFocus} offsetY={0}>
          <RenameContainer
            onSave={handleNewBoardTitle}
            placeholder={boardInfo?.title}
            onCancel={() => {
              handleCloseSettings()
              setOnFocus(false)}}
          />
        </KeyboardOverlay>
      )}
    </>
  );
};

export default UserPersonalBoard;
