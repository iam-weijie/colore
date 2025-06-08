import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  ScrollView,
} from "react-native";
import PersonalBoard from "@/components/PersonalBoard";
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { icons } from "@/constants";
import { router } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useAlert } from "@/notifications/AlertContext";
import { useUser } from "@clerk/clerk-expo";
import Header from "@/components/Header";
import { CustomButtonBar } from "@/components/CustomTabBar";
import Animated, {
  SlideInDown,
  SlideInUp,
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import ModalSheet from "@/components/Modal";
import { set } from "date-fns";
import ItemContainer from "@/components/ItemContainer";
import CustomButton from "@/components/CustomButton";
import { FindUser } from "@/components/FindUsers";
import { DetailRow, HeaderCard, ToggleRow } from "@/components/CardInfo";
import { useGlobalContext } from "@/app/globalcontext";
import { SoundType, useSoundEffects } from "@/hooks/useSoundEffects";
import { Post } from "@/types/type";
import PostModal from "@/components/PostModal";

const UserPersonalBoard = () => {
  const { user } = useUser();
  const { id, username, boardId, postId } = useLocalSearchParams();
  const { playSoundEffect } = useSoundEffects();
  const {
    hapticsEnabled,
    setHapticsEnabled,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
  } = useGlobalContext();
  const [isBoardSettingsVisible, setIsBoardSettingsVisible] =
    useState<boolean>(false);
  const [selectedSetting, setSelectedSetting] = useState<string>("");
  const [shuffleMode, setShuffleMode] = useState<boolean>(false);
  const [boardInfo, setBoardInfo] = useState<any>();
  const [post, setPost] = useState<Post>();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const isOwnBoard = !id || id == user?.id;
  const [postCount, setPostCount] = useState<number>(0);
  const [joinedCommunity, setJoinedCommunity] = useState<boolean>(false);
  const [canParticipate, setCanParticipate] = useState<boolean>(false);
  const { showAlert } = useAlert();
  const handleNewPost = () => {
    router.push({
      pathname: "/root/new-post",
      params: {
        recipient_id: id,
        username: username,
        boardId: boardId,
        source: "board",
      },
    });
  };

  const handleHapticsToggle = (value: boolean) => {
    setHapticsEnabled(value);
    playSoundEffect(value ? SoundType.ToggleOn : SoundType.ToggleOff); // Play sound on toggle
  };

  const handleSoundToggle = (value: boolean) => {
    setSoundEffectsEnabled(value);
    playSoundEffect(value ? SoundType.ToggleOn : SoundType.ToggleOff); // Play sound on toggle
  };

  const fetchPosts = async (id: string[]) => {
    try {
      const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`);
      const post = response.data;

      if (!post || post.length === 0) {
        return null;
      }
      setPost(post);
      setIsModalVisible(true);
    } catch (error) {
      return null;
    }
  };

  const fetchBoard = async () => {
    if (boardId == "-1" || username == "Personal Board") return;
    try {
      const response = await fetchAPI(`/api/boards/getBoardById?id=${boardId}`);

      const isPrivate = response.data.board_type == "personal";
      setBoardInfo(response.data);
      setCanParticipate(!isPrivate);
      setPostCount(response.count);

      const hasJoined = response.data.members_id.includes(user!.id);
      setJoinedCommunity(hasJoined);
    } catch (error) {
      console.error("Failed to fetch board", error);
    }
  };

  const handleJoinCommunity = async () => {
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
  };

  const navigationControls =
    isOwnBoard || boardId == "-1"
      ? [
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
            onPress: () => {
              setIsBoardSettingsVisible(true);
            },
            isCenter: true,
          },
        ]
      : [
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
            onPress: () => {
              setIsBoardSettingsVisible(true);
            },
            isCenter: true,
          },
        ];

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
          onPress={() => setSelectedSetting("Name")}
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
          icon={icons.pencil}
          colors={["#CFB1FB", "#fef08a"]}
          iconColor="#000"
          onPress={() => setSelectedSetting("Permissions")}
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
          onPress={() => setSelectedSetting("Delete")}
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
          onPress={() => handleJoinCommunity()}
        />
      ),
    },
    {
      label: "Share",
      role: "",
      component: (
        <ItemContainer
          label={"Share board"}
          caption={"Invite your friends to this board."}
          icon={icons.send}
          colors={["#CFB1FB", "#fef08a"]}
          iconColor="#000"
          onPress={() => setSelectedSetting("Share")}
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
          onPress={() => setSelectedSetting("Members")}
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
          onPress={() => setSelectedSetting("Info")}
        />
      ),
    },
  ];

  const menuOptions =
    !isOwnBoard && boardId != "-1"
      ? allOptions.filter((option) => option.role !== "admin")
      : allOptions.filter((option) => option.label !== "Membership");

  const BoardSetting = () => {
    return (
      <ModalSheet
        title={!selectedSetting ? "Board Settings" : selectedSetting}
        isVisible={isBoardSettingsVisible}
        onClose={() => {}}
      >
        <View className="flex-1 px-6 py-4">
          {!selectedSetting ? (
            <FlatList
              data={menuOptions}
              keyExtractor={(item, index) => item.label ?? `option-${index}`}
              renderItem={({ item, index }) => {
                return (
                  <View>
                    {item.role == "admin" ? (
                      index > 0 && menuOptions[index - 1].role === item.role ? (
                        <></>
                      ) : (
                        <Text className="text-[14px] font-JakartaSemiBold ml-4 text-gray-400">
                          Edit
                        </Text>
                      )
                    ) : index > 0 &&
                      menuOptions[index - 1].role === item.role ? (
                      <></>
                    ) : (
                      <Text className="text-[14px] font-JakartaSemiBold ml-4 text-gray-400">
                        Interact
                      </Text>
                    )}
                    {item.component}
                  </View>
                );
              }}
              contentContainerStyle={{ paddingBottom: 80, marginBottom: 16 }}
              showsVerticalScrollIndicator={false}
            />
          ) : selectedSetting == "Share" ? (
            <View className="flex-1">
              <FindUser selectedUserInfo={() => {}} />
            </View>
          ) : selectedSetting == "Members" ? (
            <View className="flex-1 max-h-[80%]">
              <FindUser
                selectedUserInfo={() => {}}
                inGivenList={boardInfo.members_id}
              />
            </View>
          ) : selectedSetting == "Info" ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
              className="flex-1"
            >
              <HeaderCard
                title="Information"
                color="#93c5fd"
                content={
                  <>
                    <DetailRow
                      label="Title"
                      value={`${boardInfo.title ?? username}`}
                      onPress={null}
                      accentColor="#93c5fd"
                    />

                    <DetailRow
                      label="Description"
                      value={`${boardInfo.description}`}
                      onPress={null}
                      accentColor="#93c5fd"
                    />
                    <DetailRow
                      label="Owner"
                      value={"A good person"}
                      onPress={null}
                      accentColor="#93c5fd"
                    />
                  </>
                }
              />
              <View className="my-4"></View>
              <HeaderCard
                title="Preferences"
                color="#ffe640"
                content={
                  <>
                    <ToggleRow
                      label="Notifications"
                      description="Get notified whenever there is a new post"
                      value={hapticsEnabled}
                      onValueChange={handleHapticsToggle}
                      accentColor="#ffe640"
                    />
                  </>
                }
              />
              <View className="my-4"></View>
              {selectedSetting && (
                <View className="flex-1 flex items-center w-full mb-4">
                  <CustomButton
                    className="my-2 w-[175px] h-14 self-center rounded-full shadow-none bg-black"
                    fontSize="lg"
                    title="Close"
                    padding="0"
                    onPress={() => {
                      setSelectedSetting("");
                    }}
                  />
                </View>
              )}
              <View className="my-8"></View>
            </ScrollView>
          ) : (
            <View className="flex-1 px-6 max-h-[80%]"></View>
          )}
          {selectedSetting && (
            <View className="flex-1 flex items-center w-full mb-4">
              <CustomButton
                className="my-2 w-[175px] h-14 self-center rounded-full shadow-none bg-black"
                fontSize="lg"
                title="Close"
                padding="0"
                onPress={() => {
                  setSelectedSetting("");
                }}
              />
            </View>
          )}
        </View>
      </ModalSheet>
    );
  };

  useEffect(() => {
    fetchBoard();
  }, [joinedCommunity]);

  useEffect(() => {
    if (postId) {
      fetchPosts([postId as string]);
    }
  }, [postId]);

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
            <View className="m-6 flex-row justify-between items-center w-full px-4">
              <Animated.View entering={FadeIn.duration(800)}>
                {username ? (
                  <View className="max-w-[200px]">
                    <Text className={`text-xl font-JakartaBold`}>
                      {username}
                    </Text>
                  </View>
                ) : (
                  <Text
                    className={`text-xl bg-[#E7E5Eb] text-[#E7E5Eb] font-JakartaBold`}
                  >
                    Personal Board
                  </Text>
                )}
                {boardInfo ? (
                  <View className="max-w-[200px]">
                    <Text className=" text-[14px] text-gray-600 text-left font-Jakarta">
                      {boardInfo.description}
                    </Text>
                  </View>
                ) : (
                  <View>
                    <Text className=" text-[14px] text-gray-600 text-left font-Jakarta">
                      Your personal space.
                    </Text>
                  </View>
                )}
              </Animated.View>
              {boardInfo && (
                <View className="flex-row gap-6 mr-7">
                  <View>
                    <Text className="text-lg font-JakartaSemiBold">
                      {postCount}
                    </Text>
                    <Text className="text-xs font-JakartaSemiBold">Posts</Text>
                  </View>
                  <View className="flex-column items-start justify-center">
                    <Text className="text-lg font-JakartaSemiBold">
                      {boardInfo?.members_id.length}
                    </Text>
                    <Text className="text-xs font-JakartaSemiBold">
                      Members
                    </Text>
                  </View>
                </View>
              )}
            </View>
          }
        />

        <PersonalBoard
          userId={id as string}
          boardId={boardId}
          shuffleModeOn={shuffleMode}
          setShuffleModeOn={() => setShuffleMode(false)}
        />
        <CustomButtonBar buttons={navigationControls} />
        {isBoardSettingsVisible && BoardSetting()}
      </View>
      {isModalVisible && post && (
        <PostModal
          isVisible={!!isModalVisible}
          selectedPosts={[post]}
          handleCloseModal={() => {
            setIsModalVisible(false);
          }}
        />
      )}
    </>
  );
};

export default UserPersonalBoard;
