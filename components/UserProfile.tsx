import { useNavigationContext } from "@/components/NavigationContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import PostGallery from "@/components/PostGallery";
import { countries } from "@/constants/countries";
import { allColors, defaultColors } from "@/constants/colors";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import { useDecryptPosts } from "@/hooks/useDecrypt";

import axios from "axios";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  fetchFriendNickname,
  fetchFriends,
  fetchFriendStatus,
  unfriend,
} from "@/lib/friend";
import {
  FriendStatusType,
  Post,
  UserData,
  UserNicknamePair,
  UserProfileProps,
  UserProfileType,
  Board as UserBoard,
  Board,
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
} from "react-native-reanimated";
import { useAlert } from "@/notifications/AlertContext";
import Settings from "@/app/root/settings";
import BoardGallery from "./BoardGallery";
import PostContainer from "./PostContainer";
import { fetchCountryEmoji } from "@/lib/post";
import Header from "./Header";
import { Ionicons } from "@expo/vector-icons";
import { myProfileTutorialPages, userTutorialPages } from "@/constants/tutorials";
import { checkTutorialStatus, completedTutorialStep } from "@/hooks/useTutorial";
import CarouselPage from "./CarrousselPage";
import ModalSheet from "./Modal";
import { useDevice } from "@/app/contexts/DeviceContext";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import { useNotificationsContext } from "@/app/contexts/NotificationsContext";
import { useBoardsContext, Board as ContextBoard } from "@/app/contexts/BoardsContext";
import { useFriendsContext } from "@/app/contexts/FriendsContext";
import { useUserDataContext } from "@/app/contexts/UserDataContext";
import PersonalBoard from "./PersonalBoard";
import PostItBoard from "./PostItBoard";
import { calculateSRB } from "@/hooks/useColors";
import { formatNumber } from "@/lib/utils";

// Skeleton component for post loading states
const PostSkeleton = React.memo(() => (
  <Animated.View entering={FadeIn.duration(600)} className="w-full px-4 my-3">
    <View className="bg-gray-200 rounded-2xl w-full h-32 opacity-70" />
  </Animated.View>
));

// Skeleton UI for posts section during loading
const PostGallerySkeleton = React.memo(() => (
  <Animated.View entering={FadeIn.duration(400)} className="w-full">
    <View className="w-full mx-8 flex flex-row items-center justify-between mb-4">
      <View className="w-32 h-6 bg-gray-200 rounded opacity-70" />
      <View className="w-16 h-4 bg-gray-200 rounded opacity-70" />
    </View>
    <PostSkeleton />
    <PostSkeleton />
    <PostSkeleton />
  </Animated.View>
));

const UserProfile: React.FC<UserProfileProps> = React.memo(({
  userId,
  nickname,
  tab,
  onSignOut,
}) => {
  const router = useRouter();
  const { user } = useUser();
  const { isIpad } = useDevice();
  const { profile } = useProfileContext();
  const { unreadComments } = useNotificationsContext();
  const { showAlert } = useAlert();
  const { encryptionKey } = useEncryptionContext();

  const [personalBoards, setPersonalBoards] = useState<UserBoard[]>([]);
  const [communityBoards, setCommunityBoards] = useState<UserBoard[]>([]);

  const isEditable = useMemo(() => user!.id === userId, [user, userId]);

  // Tutorial constants
  const pages = useMemo(() => isEditable ? myProfileTutorialPages : userTutorialPages, [isEditable]);
  const totalSteps = useMemo(() => pages.length, [pages]);
     
  // Tutorial Logic
  const [skipIntro, setSkipIntro] = useState<boolean>(true);
       
  const fetchTutorialStatus = useCallback(async () => {
    const isTutorialcompleted = isEditable ? 
      await checkTutorialStatus("my-profile-1") : 
      await checkTutorialStatus("user-profile-1");
    setSkipIntro(isTutorialcompleted);
  }, [isEditable]);

  const handleCompleteTutorial = useCallback(async () => {
    const isCompleted = isEditable ? 
      await completedTutorialStep("my-profile-1") : 
      await completedTutorialStep("user-profile-1");
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
  const { userColors } = useProfileContext();
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
  const { stateVars, setStateVars } = useNavigationContext();
  
  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [myBoards, setMyBoards] = useState<UserBoard[]>([]);
  
  const [convId, setConvId] = useState<string | null>(null);

  const [friendStatus, setFriendStatus] = useState<FriendStatusType>(
    FriendStatus.UNKNOWN
  );
  const [friendNickname, setFriendNickname] = useState<string>("");
  const [friendCount, setFriendCount] = useState<number>(0);
  const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
  const [isFocusedOnProfile, setIsFocusedOnProfile] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>(tab || (isEditable ? "Notes" : "Board"));

  const [trustValue, setTrustValue] = useState<number>(0);

  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
  const [disableInteractions, setDisableInteractions] = useState<boolean>(false);

  const Flag = useMemo(() => 
    countries[(userProfile?.country || "Canada") as keyof typeof countries]
  , [userProfile?.country]);

  const fetchFriendCount = useCallback(async () => {
    if (user!.id === userId) {
      const data = await fetchFriends(user!.id);
      setFriendCount(data.length);
    }
  }, [user, userId]);

  // Add useFocusEffect to reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reload user data when screen is focused (e.g., after location change)
      fetchUserData();
      
      if (isEditable) {
        fetchUserPosts();
        fetchPersonalPosts();
      } else {
        // Use context data instead of direct API calls
        if (personalBoards) {
          
          fetchPersonalBoards();
          fetchCommunityBoards();
        }
      }

      return () => {
        // Cleanup if needed
      };
    }, [userId, stateVars])
  );

  useEffect(() => {
    const getTrustValue = async () => {
      const result = await calculateSRB(userId, userColors);
      setTrustValue(result.Trust);
    }

    const getFriendStatus = async () => {
      let status;
      if (user!.id !== userId) {
        status = await fetchFriendStatus(userId, user!);
        setFriendStatus(status);
      }
    };

    const getFriendNickname = async () => {
      let result;
      if (user!.id !== userId) {
        result = await fetchFriendNickname(user!.id, userId);
        setFriendNickname(result.nickname);
      }
    };

    getFriendStatus();
    getFriendNickname();
    fetchFriendCount();
    getTrustValue();
  }, [userId, user, fetchFriendCount]);

  const [postsPreloaded, setPostsPreloaded] = useState<boolean>(false);
  const [postsDecrypted, setPostsDecrypted] = useState<boolean>(false);
  const [firstLoadComplete, setFirstLoadComplete] = useState<boolean>(false);
  const postsLastLoadedTimestamp = useRef<number>(0);

  // Use the new decrypt posts hook
  const { decryptPosts } = useDecryptPosts({
    encryptionKey,
    userId,
    debugPrefix: "UserProfile"
  });

  const handlePostsRefresh = async () => {
    const response = await fetchPersonalPosts();
    return response;
  }

  const handleNewPostFetch = async (excludeIds: number[]) => {
    await fetchUserPosts();
  }
  
  // Preload posts when the profile is first loaded
  const preloadPosts = useCallback(async () => {
    if (postsPreloaded && postsDecrypted) return;
    
    try {
      const response = await fetchAPI(
        `/api/posts/getUserPosts?id=${userId}&page=0`,
        { method: "GET" }
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const { userInfo, posts, pagination } = response as UserData;
      
      // Process and decrypt posts
      setUserProfile(userInfo);
      
      // Decrypt posts if encryption key is available
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

  // Modify fetchUserData to check if a refresh is actually needed
  const fetchUserData = useCallback(async (resetPagination = true) => {
    // Don't fetch if we already have all posts
    if (!resetPagination && userPosts.length >= totalPosts) {
      setHasMore(false);
      return;
    }
    
    // Check if we need to refresh posts
    const now = Date.now();
    const needsRefresh = 
      // Always fetch if forced reset (typically for new posts)
      resetPagination || 
      // Or if posts haven't been loaded yet
      !postsPreloaded ||
      // Or if there are unread comments/notifications
      (unreadComments > 0) ||
      // Ensure we don't refresh too frequently (at least 3 minutes between refreshes)
      (now - postsLastLoadedTimestamp.current > 180000);
    
    // Skip refresh if we already have the data and it's been decrypted
    if (!needsRefresh && userPosts.length > 0 && postsDecrypted) {
      console.log("[DEBUG] UserProfile - Skipping posts refresh, using cached and decrypted data");
      setLoading(false);
      return;
    }
    
    if (resetPagination) {
      setPage(0);
      // Only show loading state if we don't have any posts yet or it's the first load
      if (!postsPreloaded || userPosts.length === 0 || !firstLoadComplete) {
        setLoading(true);
      }
    } else {
      // Prevent multiple simultaneous loading calls
      if (isLoadingMore) return;
      setIsLoadingMore(true);
    }
    
    setError(null);
    try {
      const currentPage = resetPagination ? 0 : page;
      
      const response = await fetchAPI(
        `/api/posts/getUserPosts?id=${userId}&page=${currentPage}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        throw new Error(response.error);
      }
      
      const { userInfo, posts, pagination } = response as UserData;
      
      // Stop if we received no posts
      if (posts.length === 0) {
        setHasMore(false);
        return;
      }
      
      setUserProfile(userInfo);
      setTotalPosts(pagination?.total || userInfo.total_posts || posts.length);
      
      // Decrypt new posts and merge them with existing posts
      const processedPosts = encryptionKey ? decryptPosts(posts) : posts;
      
      if (resetPagination) {
        setUserPosts(processedPosts);
      } else {
        // Avoid duplicates
        const newPostIds = new Set(processedPosts.map(post => post.id));
        const filteredCurrentPosts = userPosts.filter(post => !newPostIds.has(post.id));
        setUserPosts([...filteredCurrentPosts, ...processedPosts]);
      }
      
      // Update pagination state
      setHasMore(pagination?.hasMore || false);
      setPage(currentPage + 1);
      
      // Fetch country emoji only on initial load
      if (resetPagination && !postsPreloaded) {
        setEmojiLoading(true);
        const flagEmoji = await fetchCountryEmoji(userInfo.country);
        setCountryEmoji(() => flagEmoji);
        setEmojiLoading(false);
      }

      // Update timestamp after successful load
      postsLastLoadedTimestamp.current = Date.now();
      setPostsPreloaded(true);
      setPostsDecrypted(true);
      
      // After first successful load, mark first load as complete
      // This will enable skipping animations on subsequent views
      if (!firstLoadComplete) {
        setFirstLoadComplete(true);
      }
    } catch (error) {
      setError("Failed to fetch user data.");
      console.error("Failed to fetch user data:", error);
    } finally {
      if (resetPagination) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [userId, page, isLoadingMore, userPosts.length, totalPosts, postsPreloaded, postsDecrypted, firstLoadComplete, unreadComments, encryptionKey, decryptPosts]);

  // Monitor the encryption status of posts
  useEffect(() => {
    // When posts are loaded and encryption key is available, mark posts as decrypted
    if (userPosts.length > 0 && encryptionKey && !postsDecrypted) {
      setPostsDecrypted(true);
    }
  }, [userPosts, encryptionKey, postsDecrypted]);

  const loadMorePosts = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setPage(prevPage => prevPage + 1);
      fetchUserData(false);
    }
  }, [isLoadingMore, hasMore, fetchUserData]);

  const fetchUserPosts = async () => {
    try {
      const response = await fetchAPI(`/api/posts/getUserPosts?id=${userId}`, {
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const { posts } = response;
      setUserPosts(posts)
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    }
  }

  const fetchPersonalPosts = async () => {
    try {
      // Get all personal posts including pinned ones
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?number=${12}&recipient_id=${userId}&user_id=${user!.id}`
      );

      // Handle invalid or empty response data more carefully
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.log("[DEBUG] UserProfile - No valid personal posts data received");
        setDisableInteractions(true);
        setPersonalPosts([]);
        return;
      }

      console.log("[DEBUG] UserProfile - Raw API response:", {
        totalPosts: response.data.length,
        postsWithContent: response.data.filter((p: Post) => p && p.content).length,
        postsWithPinned: response.data.filter((p: Post) => p && p.pinned).length,
        samplePost: response.data[0] ? {
          id: response.data[0].id,
          hasContent: !!response.data[0].content,
          contentLength: response.data[0].content?.length || 0,
          contentPreview: response.data[0].content?.substring(0, 50) || "No content",
          isPinned: response.data[0].pinned
        } : "No posts"
      });

      // Filter only pinned posts
      const filteredPosts = response.data.filter((p: Post) => p && p.pinned);

      if (filteredPosts.length === 0) {
        console.log("[DEBUG] UserProfile - No pinned posts found, showing all personal posts");
        
        // If no pinned posts, show all personal posts instead of empty view
        const allPersonalPosts = response.data.filter((p: Post) => p && p.content);
        
        if (allPersonalPosts.length === 0) {
          console.log("[DEBUG] UserProfile - No personal posts with content found");
          setDisableInteractions(true);
          setPersonalPosts([]);
        } else {
          console.log(`[DEBUG] UserProfile - Found ${allPersonalPosts.length} personal posts with content`);
          
          // Sort by creation date (newest first)
          const sortedPosts = [...allPersonalPosts].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          // Decrypt personal posts using our caching logic
          if (encryptionKey) {
            const decryptedPosts = decryptPosts(sortedPosts);
            setPersonalPosts(decryptedPosts);
          } else {
            setPersonalPosts(sortedPosts);
          }
          
          // Enable interactions since we found posts
          setDisableInteractions(false);
          setProfileLoading(false);
        }
      } else {
        console.log(`[DEBUG] UserProfile - Found ${filteredPosts.length} pinned posts`);
        
        // Display pinned posts with higher priority
        const sortedPosts = [...filteredPosts].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // Decrypt personal posts using our caching logic
        if (encryptionKey) {
          const decryptedPosts = decryptPosts(sortedPosts);
          setPersonalPosts(decryptedPosts);
        } else {
          setPersonalPosts(sortedPosts);
        }
        
        // Enable interactions since we found pinned posts
        setDisableInteractions(false);
        setProfileLoading(false);

        return filteredPosts
      }
    } catch (error) {
      console.error("[DEBUG] UserProfile - Failed to fetch personal posts:", error);
      setDisableInteractions(true);
      setPersonalPosts([]);
    }
  }

  const fetchPersonalBoards = async () => {

      try {
        const response = await fetchAPI(`/api/boards/getBoards?user_id=${userId}`, {
          method: "GET",
        });
        if (response.error) {
          throw new Error(response.error);
        }

        const boardWithColor = response.data.map((board: Board) => ({
          ...board,
          color: userColors[Math.floor(Math.random() * userColors.length)].hex  || "yellow",
        }));
        setPersonalBoards(boardWithColor);
      } catch (error) {
        console.error("[DEBUG] UserProfile - Failed to fetch personal boards:", error);
      }
  };

  const fetchCommunityBoards = async () => {

      try {
        const response = await fetchAPI(`/api/boards/getCommunityBoards?userId=${userId}`, {
          method: "GET",
        });
        if (response.error) {
          throw new Error(response.error);
        }
        const boardWithColor = response.data.map((board: Board) => ({
          ...board,
          color: userColors[Math.floor(Math.random() * userColors.length)].hex || "#F59E0B",
        }));
        setCommunityBoards(boardWithColor);  
      } catch (error) {
        console.error("[DEBUG] UserProfile - Failed to fetch community boards:", error);
      }
  }

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
    { name: "Profile", key: "Profile", color: "#CFB1FB", notifications: 0 },
    {
      name: "Notes",
      key: "Notes",
      color: "#CFB1FB",
      notifications: unreadComments,
    },
    { name: "Settings", key: "Settings", color: "#93c5fd", notifications: 0 },
  ];

  const userTabs = [
    { name: "Profile", key: "Profile", color: "#CFB1FB", notifications: 0 },
    { name: "Board", key: "Board", color: "#CFB1FB" },
    {
      name: "Communities",
      key: "Communities",
      color: "#93c5fd",
      notifications: 0,
    },
  ];

  const handleTabChange = useCallback((tabKey: string) => {
    console.log("[DEBUG] UserProfile - Tab changed to:", tabKey);
    setSelectedTab(tabKey);
  }, []);

  const handleClearSearch = useCallback(() => {
    setQuery("");
  }, []);

  // Fix the handlePostUpdate function to properly call fetchUserData
  const handlePostUpdate = useCallback((id: number, isRemove: boolean = false) => {
    console.log(`[DEBUG] UserProfile - Updating post ${id}, isRemove: ${isRemove}`);
    // Force refresh posts by calling fetchUserData with true
    fetchUserData(true);
    // Note: We're ignoring the id and isRemove parameters as fetchUserData 
    // will refresh all posts regardless
  }, [fetchUserData]);

  // Add this effect to preload posts when component mounts
  useEffect(() => {
    preloadPosts();
  }, [preloadPosts]);

  useEffect(() => {
    if (selectedTab === "Settings") {
      console.log("[DEBUG] UserProfile - Settings tab selected");
    }
  }, [selectedTab]);

  // Updated empty posts view with different messages for self vs other profiles
  const EmptyPostsView = () => {

   // Check if viewing own profile or someone else's
  const isOwnProfile = user!.id === userId;

  // Define a complete Post object matching all required properties with all the required fields
  const defaultPost = {
    id: 0, // Use 0 instead of negative ID
    clerk_id: userId,
    user_id: userId,
    firstname: "",
    username: "",
    content: 
    isOwnProfile ? `You have no pinned posts yet. \n\nPinned posts will appear here.
    Create a personal post and pin it with the three dots (⋯) at the bottom right of the post view!\nShare things about yourself with your friends!

      ` : 
      `Hi, I'm a new Coloré user! \n\nI haven't pinned any posts to my profile yet.
      `,
    created_at: new Date().toISOString(), // Valid date string
    expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    recipient_user_id: "",
    pinned: false,
    color: "yellow",
    emoji: "",
    notified: true,
    prompt_id: -1, // Use 0 instead of negative ID
    prompt: "",
    board_id: -1,
    reply_to: 0, // Use 0 instead of negative ID
    // Adding missing required properties
    nickname: "",
    incognito_name: "",
    available_at: new Date().toISOString(), // Valid date string
    static_emoji: false,
    formatting: [],
    unread: false 
  } as unknown as Post;
   
    
   return (
    
                <PostContainer
                  selectedPosts={[defaultPost]}
                  handleCloseModal={() => {}}
                  isShowCasing={true}
                />
      
   )
  };

  return (
    <View className="absolute w-full h-full flex-1 bg-[#FAFAFA]">
      {/* HEADER */}
      <Header
        title=""
        item={
          <View className="flex-row w-full  justify-between items-center pl-6 pr-6 mt-2">
            <Animated.View
              entering={FadeIn.duration(800)}
              className="flex flex-row items-center gap-2"
            >
              <View>
                <Flag width={32} height={32} />
              </View>
              <View>
                {friendNickname || userProfile?.username ? (
                  <Text className={`text-xl font-JakartaBold`}>
                    {friendNickname
                      ? friendNickname
                      : userProfile?.username
                        ? `${friendStatus === FriendStatus.RECEIVED || friendStatus === FriendStatus.FRIENDS ? userProfile?.nickname || userProfile?.username : userProfile?.username}`
                        : `${userProfile?.firstname?.charAt(0)}.`}{" "}
                  </Text>
                ) : (
                  <Text
                    className={`text-xl bg-[#E7E5Eb] text-[#E7E5Eb] font-JakartaBold`}
                  >
                    Username
                  </Text>
                )}
                {userProfile ? (
                  <View className="max-w-[200px]">
                    <Text className=" text-[14px] text-gray-600 text-left font-Jakarta">
                      {userProfile?.city == userProfile?.state
                        ? ""
                        : `${userProfile?.city}, `}{" "}
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
                  <Text className="text-lg font-JakartaSemiBold">
                    {totalPosts}
                  </Text>
                  <Text className="text-[14px] font-JakartaSemiBold">
                    Notes
                  </Text>
                </View>
                <View className="flex-column items-start justify-center">
                  <Text className="text-lg font-JakartaSemiBold">
                    {friendCount}
                  </Text>
                  <Text className="text-[14px] font-JakartaSemiBold">
                    Friends
                  </Text>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-6 mr-7">
                <View>
                  <Text className="text-lg font-JakartaSemiBold">
                    {formatNumber(trustValue)}
                  </Text>
                  <Text className="text-[14px] font-JakartaSemiBold">
                    Trust
                  </Text>
                </View>
                <View className="flex-column items-start justify-center">
                  <Text className="text-lg font-JakartaSemiBold">
                    {userProfile?.colors?.length ?? 0}
                  </Text>
                  <Text className="text-[14px] font-JakartaSemiBold">
                    Colors
                  </Text>
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
        <View className="flex-1">
            <View className={`absolute -top-[20%]`}>
              {!profileLoading && personalPosts.length > 0 ? (
                <PostContainer
                  selectedPosts={personalPosts}
                  handleCloseModal={() => {}}
                  isPreview={disableInteractions}
                />
              ) : (
                <EmptyPostsView />
              )}
            </View>
            </View>
      )}

      {selectedTab === "Notes" && (
        <View className="relative flex-1 w-full h-full bg-[#FAFAFA] ">
          <View
            className="absolute flex flex-row items-center bg-white rounded-[24px] px-4 h-12 w-[85%] top-6 self-center z-[10] "
            style={{
              boxShadow: "0 0 7px 1px rgba(120,120,120,.1)",
            }}
          >
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 pl-2 text-md "
              placeholder="Looking for a note..?"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClearSearch}
                className="w-6 h-6 items-center justify-center"
              >
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          {loading && !postsDecrypted ? (
            <PostGallerySkeleton />
          ) : (
            <View className="flex-1 h-full w-full px-4 -mt-12">
              <PostGallery
                posts={userPosts}
                profileUserId={user!.id}
                handleUpdate={handlePostUpdate}
                query={query}
                offsetY={120}
                onLoadMore={loadMorePosts}
                isLoading={isLoadingMore}
                hasMore={hasMore}
              />
            </View>
          )}
        </View>
      )}

      {selectedTab === "Board" && (
        <View className="flex-1">
          <PostItBoard 
          userId={userId} 
          handlePostsRefresh={handlePostsRefresh} 
          handleNewPostFetch={handlePostsRefresh} 
          handleUpdatePin={() => {}} 
          allowStacking={false} 
          randomPostion={false} />
        </View>
        
      )}

            {selectedTab === "Communities" && <View className="flex-1 pt-4">
            <BoardGallery 
              boards={communityBoards}
              offsetY={0} />
            </View>}

            {selectedTab === "Settings" && (
              <>
                <Settings />
              </>
            )}
        
  <ModalSheet 
        title={""} 
        isVisible={!skipIntro} 
        onClose={() => {
          setSkipIntro(true)
          }} >
            <View className="flex-1 px-4">
            <CarouselPage
          label={pages[step].label}
          caption={pages[step].caption}
          color={pages[step].color}
          onSubmit={handleNext}
          progress={step + 1}
          total={totalSteps}
          disabled={pages[step].disabled}
        >
          {pages[step].children}
        </CarouselPage>
        </View>
        </ModalSheet>
    </View>
  );
});

export default UserProfile;
