// UserProfile.tsx
import { useNavigationContext } from "@/components/NavigationContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import PostGallery from "@/components/PostGallery";
import { countries } from "@/constants/countries";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import { useDecryptPosts } from "@/hooks/useDecrypt";

import {
  fetchFriendNickname,
  fetchFriends,
  fetchFriendStatus,
} from "@/lib/friend";
import {
  FriendStatusType,
  Post,
  UserData,
  UserProfileProps,
  UserProfileType,
  Board as UserBoard,
  Board,
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAlert } from "@/notifications/AlertContext";
import Settings from "@/app/root/settings";

import { fetchCountryEmoji } from "@/lib/post";
import Header from "../Header";
import { myProfileTutorialPages, userTutorialPages } from "@/constants/tutorials";
import { checkTutorialStatus, completedTutorialStep } from "@/hooks/useTutorial";
import { useDevice } from "@/app/contexts/DeviceContext";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import { useNotificationsContext } from "@/app/contexts/NotificationsContext";

import { calculateSRB } from "@/hooks/useColors";
import { formatNumber } from "@/lib/utils";
import ProfileTab from "./ProfileTab";
import NotesTab from "./NotesTab";
import BoardTab from "./BoardTab";
import CommunitiesTab from "./CommunitiesTab";
import { useBackgroundColor, useTextColor, useThemeColors } from "@/hooks/useTheme";

const UserProfile: React.FC<UserProfileProps> = React.memo(
  ({ userId, nickname, tab, onSignOut }) => {
    const router = useRouter();
    const { user } = useUser();
    const { isIpad } = useDevice();
    const { profile, userColors } = useProfileContext();
    const { unreadComments } = useNotificationsContext();
    const { showAlert } = useAlert();
    const { encryptionKey } = useEncryptionContext();
    const { stateVars, setStateVars } = useNavigationContext();

    const [personalBoards, setPersonalBoards] = useState<UserBoard[]>([]);
    const [communityBoards, setCommunityBoards] = useState<UserBoard[]>([]);

    const isEditable = useMemo(() => user!.id === userId, [user, userId]);

    // Tutorial constants
    const pages = useMemo(
      () => (isEditable ? myProfileTutorialPages : userTutorialPages),
      [isEditable]
    );
    const totalSteps = useMemo(() => pages.length, [pages]);

    // Tutorial Logic
    const [skipIntro, setSkipIntro] = useState<boolean>(true);

    const fetchTutorialStatus = useCallback(async () => {
      const isTutorialcompleted = isEditable
        ? await checkTutorialStatus("my-profile-1")
        : await checkTutorialStatus("user-profile-1");
      setSkipIntro(isTutorialcompleted);
    }, [isEditable]);

    const handleCompleteTutorial = useCallback(async () => {
      const isCompleted = isEditable
        ? await completedTutorialStep("my-profile-1")
        : await completedTutorialStep("user-profile-1");
      return isCompleted;
    }, [isEditable]);

    useEffect(() => {
      fetchTutorialStatus();
    }, [fetchTutorialStatus]);

    const [step, setStep] = useState(0);
    const handleNext = useCallback(() => {
      if (step < totalSteps - 1) setStep((prev) => prev + 1);
      else {
        handleCompleteTutorial();
        setSkipIntro(true);
      }
    }, [step, totalSteps, handleCompleteTutorial]);

    const [query, setQuery] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);
    const [emojiLoading, setEmojiLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfileType | null | undefined>(
      isEditable ? profile : null
    );
    const [countryEmoji, setCountryEmoji] = useState<string>("");
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [totalPosts, setTotalPosts] = useState<number>(0);

    // Pagination state
    const [page, setPage] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

    const [convId, setConvId] = useState<string | null>(null);

    const [friendStatus, setFriendStatus] = useState<FriendStatusType>(
      FriendStatus.UNKNOWN
    );
    const [friendNickname, setFriendNickname] = useState<string>("");
    const [friendCount, setFriendCount] = useState<number>(0);
    const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
    const [isFocusedOnProfile, setIsFocusedOnProfile] = useState<boolean>(true);
    const [selectedTab, setSelectedTab] = useState<string>(
      tab || (isEditable ? "Notes" : "Board")
    );

    const [trustValue, setTrustValue] = useState<number>(0);

    const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
    const [disableInteractions, setDisableInteractions] = useState<boolean>(false);

    const countryKey = (userProfile?.country || "Canada").trim();
    const Flag = useMemo(() => countries[countryKey as keyof typeof countries], [countryKey]);

    const fetchFriendCount = useCallback(async () => {
      if (user!.id === userId) {
        const data = await fetchFriends(user!.id);
        setFriendCount(data.length);
      }
    }, [user, userId]);

    const textColor = useTextColor()
    const backgroundColor = useBackgroundColor()
    const colors = useThemeColors()

    // Add useFocusEffect to reload data when screen comes into focus
    useFocusEffect(
      useCallback(() => {
        // Reload user data when screen is focused (e.g., after location change)
        fetchUserData();

        if (isEditable) {
          fetchUserPosts();
          fetchPersonalPosts();
        } else {
          fetchPersonalBoards();
          fetchCommunityBoards();
        }

        return () => {};
      }, [userId, stateVars])
    );

    useEffect(() => {
      const getTrustValue = async () => {
        const result = await calculateSRB(userId, userColors);
        setTrustValue(result.Trust);
      };

      const getFriendStatus = async () => {
        if (user!.id !== userId) {
          const status = await fetchFriendStatus(userId, user!);
          setFriendStatus(status);
        }
      };

      const getFriendNickname = async () => {
        if (user!.id !== userId) {
          const result = await fetchFriendNickname(user!.id, userId);
          setFriendNickname(result.nickname);
        }
      };

      getFriendStatus();
      getFriendNickname();
      fetchFriendCount();
      getTrustValue();
    }, [userId, user, fetchFriendCount, userColors]);

    const [postsPreloaded, setPostsPreloaded] = useState<boolean>(false);
    const [postsDecrypted, setPostsDecrypted] = useState<boolean>(false);
    const [firstLoadComplete, setFirstLoadComplete] = useState<boolean>(false);
    const postsLastLoadedTimestamp = useRef<number>(0);

    // decrypt hook
    const { decryptPosts } = useDecryptPosts({
      encryptionKey,
      userId,
      debugPrefix: "UserProfile",
    });

    const handlePostsRefresh = async () => {
      const response = await fetchPersonalPosts();
      return response;
    };

    const handleNewPostFetch = async (excludeIds: number[]) => {
      await fetchUserPosts();
    };

    // Preload posts once
    const preloadPosts = useCallback(async () => {
      if (postsPreloaded && postsDecrypted) return;

      try {
        const response = await fetchAPI(`/api/posts/getUserPosts?id=${userId}&page=0`, {
          method: "GET",
        });

        if ((response as any)?.error) {
          throw new Error((response as any).error);
        }

        const { userInfo, posts, pagination } = response as UserData;

        // Process and decrypt posts
        setUserProfile(userInfo);

        const processedPosts = encryptionKey ? decryptPosts(posts) : posts;

        setUserPosts(processedPosts);
        setTotalPosts(pagination?.total || userInfo.total_posts || posts.length);
        setHasMore(pagination?.hasMore || false);
        setPage(1);

        // Preload country emoji too
        setEmojiLoading(true);
        const flagEmoji = await fetchCountryEmoji(userInfo.country);
        setCountryEmoji(flagEmoji);
        setEmojiLoading(false);

        // Mark posts as preloaded and record timestamp
        setPostsPreloaded(true);
        setPostsDecrypted(true);
        postsLastLoadedTimestamp.current = Date.now();
        setLoading(false);
      } catch (error) {
        console.error("[DEBUG] UserProfile - Failed to preload posts:", error);
        setError("Failed to preload user data.");
      }
    }, [userId, postsPreloaded, postsDecrypted, encryptionKey, decryptPosts]);

    // Core data fetcher with pagination
    const fetchUserData = useCallback(
      async (resetPagination = true) => {
        if (!resetPagination && userPosts.length >= totalPosts) {
          setHasMore(false);
          return;
        }

        const now = Date.now();
        const needsRefresh =
          resetPagination ||
          !postsPreloaded ||
          unreadComments > 0 ||
          now - postsLastLoadedTimestamp.current > 180000;

        if (!needsRefresh && userPosts.length > 0 && postsDecrypted) {
          setLoading(false);
          return;
        }

        if (resetPagination) {
          setPage(0);
          if (!postsPreloaded || userPosts.length === 0 || !firstLoadComplete) {
            setLoading(true);
          }
        } else {
          if (isLoadingMore) return;
          setIsLoadingMore(true);
        }

        setError(null);
        try {
          const currentPage = resetPagination ? 0 : page;

          const response = await fetchAPI(
            `/api/posts/getUserPosts?id=${userId}&page=${currentPage}`,
            { method: "GET" }
          );
          if ((response as any)?.error) {
            throw new Error((response as any).error);
          }

          const { userInfo, posts, pagination } = response as UserData;

          if (posts.length === 0) {
            setHasMore(false);
            return;
          }

          setUserProfile(userInfo);
          setTotalPosts(pagination?.total || userInfo.total_posts || posts.length);

          const processedPosts = encryptionKey ? decryptPosts(posts) : posts;

          if (resetPagination) {
            setUserPosts(processedPosts);
          } else {
            const newPostIds = new Set(processedPosts.map((p) => p.id));
            const filteredCurrent = userPosts.filter((p) => !newPostIds.has(p.id));
            setUserPosts([...filteredCurrent, ...processedPosts]);
          }

          setHasMore(pagination?.hasMore || false);
          setPage(currentPage + 1);

          if (resetPagination && !postsPreloaded) {
            setEmojiLoading(true);
            const flagEmoji = await fetchCountryEmoji(userInfo.country);
            setCountryEmoji(() => flagEmoji);
            setEmojiLoading(false);
          }

          postsLastLoadedTimestamp.current = Date.now();
          setPostsPreloaded(true);
          setPostsDecrypted(true);

          if (!firstLoadComplete) setFirstLoadComplete(true);
        } catch (error) {
          setError("Failed to fetch user data.");
          console.error("Failed to fetch user data:", error);
        } finally {
          if (resetPagination) setLoading(false);
          else setIsLoadingMore(false);
        }
      },
      [
        userId,
        page,
        isLoadingMore,
        userPosts.length,
        totalPosts,
        postsPreloaded,
        postsDecrypted,
        firstLoadComplete,
        unreadComments,
        encryptionKey,
        decryptPosts,
        userPosts,
      ]
    );

    // mark decrypted
    useEffect(() => {
      if (userPosts.length > 0 && encryptionKey && !postsDecrypted) {
        setPostsDecrypted(true);
      }
    }, [userPosts, encryptionKey, postsDecrypted]);

    const loadMorePosts = useCallback(() => {
      if (!isLoadingMore && hasMore) {
        setPage((p) => p + 1);
        fetchUserData(false);
      }
    }, [isLoadingMore, hasMore, fetchUserData]);

    const fetchUserPosts = async () => {
      try {
        const response = await fetchAPI(`/api/posts/getUserPosts?id=${userId}`, {
          method: "GET",
        });
        if ((response as any)?.error) throw new Error((response as any).error);
        const { posts } = response as any;
        setUserPosts(posts);
      } catch (error) {
        console.error("Failed to fetch user posts:", error);
      }
    };

    const fetchPersonalPosts = async () => {
      try {
        const response = await fetchAPI(
          `/api/posts/getPersonalPosts?number=${12}&recipient_id=${userId}&user_id=${user!.id}`
        );

        if (!response || !response.data || !Array.isArray(response.data)) {
          setDisableInteractions(true);
          setPersonalPosts([]);
          return;
        }

        const filteredPinned = response.data.filter((p: Post) => p && p.pinned);

        const base = filteredPinned.length
          ? filteredPinned
          : response.data.filter((p: Post) => p && p.content);

        if (base.length === 0) {
          setDisableInteractions(true);
          setPersonalPosts([]);
        } else {
          const sorted = [...base].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setPersonalPosts(encryptionKey ? decryptPosts(sorted) : sorted);
          setDisableInteractions(false);
          setProfileLoading(false);
        }
        return response.data;
      } catch (error) {
        console.error("[DEBUG] UserProfile - Failed to fetch personal posts:", error);
        setDisableInteractions(true);
        setPersonalPosts([]);
      }
    };

    const fetchPersonalBoards = async () => {
      try {
        const response = await fetchAPI(`/api/boards/getBoards?user_id=${userId}`, {
          method: "GET",
        });
        if ((response as any)?.error) throw new Error((response as any).error);

        const boardWithColor = response.data.map((board: Board) => ({
          ...board,
          color: userColors[Math.floor(Math.random() * userColors.length)].hex || "yellow",
        }));
        setPersonalBoards(boardWithColor);
      } catch (error) {
        console.error("[DEBUG] UserProfile - Failed to fetch personal boards:", error);
      }
    };

    const fetchCommunityBoards = async () => {
      try {
        const response = await fetchAPI(
          `/api/boards/getCommunityBoards?userId=${userId}`,
          { method: "GET" }
        );
        if ((response as any)?.error) throw new Error((response as any).error);

        const boardWithColor = response.data.map((board: Board) => ({
          ...board,
          color: userColors[Math.floor(Math.random() * userColors.length)].hex || "#F59E0B",
        }));
        setCommunityBoards(boardWithColor);
      } catch (error) {
        console.error("[DEBUG] UserProfile - Failed to fetch community boards:", error);
      }
    };

    useEffect(() => {
      fetchUserData();
    }, [isFocusedOnProfile]);

    const handleAddNickname = useCallback(() => {
      setStateVars({
        ...stateVars,
        previousScreen: "profile",
        userId: userId,
      });
      router.push("/root/profile/nickname");
    }, [stateVars, userId, setStateVars, router]);

    const handleSendFriendRequest = useCallback(async () => {
      try {
        setIsHandlingFriendRequest(true);
        await fetchAPI(`/api/friends/newFriendRequest`, {
          method: "POST",
          body: JSON.stringify({
            clerkId: user!.id,
            friendId: userId,
          }),
        });
        showAlert({
          title: "Friend request sent!",
          message: "You have sent a friend request to this user.",
          type: "FRIEND_REQUEST",
          status: "success",
        });
        setFriendStatus(FriendStatus.SENT);
        setIsHandlingFriendRequest(false);
      } catch (error) {
        console.error("Failed to send friend request:", error);
        showAlert({
          title: "Error",
          message: `Error sending friend request.`,
          type: "ERROR",
          status: "error",
        });
      }
    }, [user, userId, showAlert]);

    const myTabs = [
      { name: "Profile", key: "Profile", notifications: 0, color: "#000" },
      { name: "Notes", key: "Notes", notifications: unreadComments, color:"#000" },
      { name: "Settings", key: "Settings", notifications: 0, color: "#000" },
    ];

    const userTabs = [
      { name: "Profile", key: "Profile", notifications: 0, color: "#000"  },
      { name: "Board", key: "Board", color: "#000" },
      { name: "Communities", key: "Communities", notifications: 0, color: "#000" },
    ];

    const handleTabChange = useCallback((tabKey: string) => {
      setSelectedTab(tabKey);
    }, []);

    const handlePostUpdate = useCallback(
      (id: number, isRemove: boolean = false) => {
        fetchUserData(true);
      },
      [fetchUserData]
    );

    // preload once
    useEffect(() => {
      preloadPosts();
    }, [preloadPosts]);

    useEffect(() => {
      if (selectedTab === "Settings") {
        // no-op log
      }
    }, [selectedTab]);

    const isOwnProfile = user!.id === userId;

    return (
      <View className="absolute w-full h-full flex-1"
        style={{
          backgroundColor: backgroundColor
        }}
        >
        {/* HEADER */}
        <Header
          title=""
          item={
            <View className="flex-row w-full  justify-between items-center pl-6 pr-6 mt-2">
              <Animated.View
                entering={FadeIn.duration(800)}
                className="flex flex-row items-center gap-2"
              >
                <View>{Flag ? <Flag width={32} height={32} /> : null}</View>
                <View>
                  {friendNickname || userProfile?.username ? (
                    <Text 
                    className={`text-xl font-JakartaBold`}
                    style={{
                      color: textColor
                    }}>
                      {friendNickname
                        ? friendNickname
                        : userProfile?.username
                        ? `${
                            friendStatus === FriendStatus.RECEIVED ||
                            friendStatus === FriendStatus.FRIENDS
                              ? userProfile?.nickname || userProfile?.username
                              : userProfile?.username
                          }`
                        : `${userProfile?.firstname?.charAt(0)}.`}{" "}
                    </Text>
                  ) : (
                    <Text className={`text-xl bg-[#E7E5Eb] text-[#E7E5Eb] font-JakartaBold`}>
                      Username
                    </Text>
                  )}
                  {userProfile ? (
                    <View className="max-w-[200px]">
                      <Text 
                      className=" text-[14px] text-left font-Jakarta"
                      style={{
                        color: colors.textSecondary
                      }}>
                        {userProfile?.city == userProfile?.state ? "" : `${userProfile?.city}, `}{" "}
                        {userProfile?.country}
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Text className="text-[14px] text-gray-700 bg-[#E7E5Eb] text-center font-Jakarta">
                        {" "}
                        Location updating...{" "}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {isEditable ? (
                <View className="flex-row gap-6 mr-7">
                  <View>
                    <Text 
                    className="text-lg font-JakartaSemiBold"
                    style={{
                      color: textColor
                    }}>{totalPosts}</Text>
                    <Text 
                    className="text-[14px] font-JakartaSemiBold"
                    style={{
                      color: textColor
                    }}>Notes</Text>
                  </View>
                  <View className="flex-column items-start justify-center">
                    <Text 
                    className="text-lg font-JakartaSemiBold"
                    style={{
                      color: textColor
                    }}>{friendCount}</Text>
                    <Text 
                    className="text-[14px] font-JakartaSemiBold"
                    style={{
                      color: textColor
                    }}>Friends</Text>
                  </View>
                </View>
              ) : (
                <View className="flex-row gap-6 mr-7">
                  <View>
                    <Text 
                    className="text-lg font-JakartaSemiBold"
                    style={{
                      color: textColor
                    }}>{formatNumber(trustValue)}</Text>
                    <Text 
                    className="text-[14px] font-JakartaSemiBold"
                    style={{
                      color: textColor
                    }}>Trust</Text>
                  </View>
                  <View className="flex-column items-start justify-center">
                    <Text className="text-lg font-JakartaSemiBold">
                      {userProfile?.colors?.length ?? 0}
                    </Text>
                    <Text 
                    className="text-[14px] font-JakartaSemiBold"
                    style={{
                      color: textColor
                    }}>Colors</Text>
                  </View>
                </View>
              )}
            </View>
          }
          tabs={isEditable ? myTabs : userTabs}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          tabCount={0}
        />

        {/* TABS */}
        {selectedTab === "Profile" && (
          <ProfileTab
            isOwnProfile={isOwnProfile}
            userId={userId}
            personalPosts={personalPosts}
            profileLoading={profileLoading}
            disableInteractions={disableInteractions}
          />
        )}

        {selectedTab === "Notes" && (
          <NotesTab
            query={query}
            setQuery={setQuery}
            loading={loading}
            postsDecrypted={postsDecrypted}
            userPosts={userPosts}
            currentUserId={user!.id}
            handlePostUpdate={handlePostUpdate}
            loadMorePosts={loadMorePosts}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
          />
        )}

        {selectedTab === "Board" && (
          <BoardTab
            userId={userId}
            handlePostsRefresh={handlePostsRefresh}
            handleNewPostFetch={handlePostsRefresh}
          />
        )}

        {selectedTab === "Communities" && (
          <CommunitiesTab boards={communityBoards} offsetY={0} />
        )}

        {selectedTab === "Settings" && <Settings />}
      </View>
    );
  }
);

export default UserProfile;
