import { useNavigationContext } from "@/components/NavigationContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import PostGallery from "@/components/PostGallery";
import { countries } from "@/constants/countries";
import { allColors, defaultColors } from "@/constants/colors";
import { FriendStatus } from "@/lib/enum";
import { fetchAPI } from "@/lib/fetch";
import { decryptText } from "@/lib/encryption";

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
} from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Animated, {
  SlideInDown,
  SlideInUp,
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import ColorGallery from "./ColorGallery";
import DropdownMenu from "./DropdownMenu";
import TabNavigation from "./TabNavigation";
import { useAlert } from "@/notifications/AlertContext";
import Circle from "./Circle";
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
  const { personalBoards, communityBoards } = useBoardsContext();
  const { friendList, refreshFriends } = useFriendsContext();
  const { savedPosts, refreshUserData } = useUserDataContext();

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
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [emojiLoading, setEmojiLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfileType | null | undefined>(
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
  
  // Remove duplicate communityBoards declaration
  const [currentSubscreen, setCurrentSubscreen] = useState<string>("posts");
  const [convId, setConvId] = useState<string | null>(null);

  const [friendStatus, setFriendStatus] = useState<FriendStatusType>(
    FriendStatus.UNKNOWN
  );
  const [friendNickname, setFriendNickname] = useState<string>("");
  const [friendCount, setFriendCount] = useState<number>(0);
  const [isHandlingFriendRequest, setIsHandlingFriendRequest] = useState(false);
  const [isFocusedOnProfile, setIsFocusedOnProfile] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>(tab || "Profile");

  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
  const [disableInteractions, setDisableInteractions] = useState<boolean>(false);

  const Flag = useMemo(() => 
    countries[(profileUser?.country || "Canada") as keyof typeof countries]
  , [profileUser?.country]);

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
          // Convert ContextBoard[] to UserBoard[] by adding required properties
          const convertedBoards = personalBoards.map(board => ({
            ...board,
            commentAllowed: true, // Default value
            // Add other required properties if needed
          }));
          setMyBoards(convertedBoards as unknown as UserBoard[]);
        }
      }

      return () => {
        // Cleanup if needed
      };
    }, [userId, stateVars, personalBoards, communityBoards])
  );

  useEffect(() => {
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
  }, [userId, user, fetchFriendCount]);

  const [postsPreloaded, setPostsPreloaded] = useState<boolean>(false);
  const [postsDecrypted, setPostsDecrypted] = useState<boolean>(false);
  const [firstLoadComplete, setFirstLoadComplete] = useState<boolean>(false);
  const postsLastLoadedTimestamp = useRef<number>(0);
  const decryptedPostsCache = useRef<Map<number, Post>>(new Map());
  
  // Clear decrypted posts cache on component unmount or when user changes
  useEffect(() => {
    return () => {
      // Clear cache when component unmounts
      decryptedPostsCache.current.clear();
    };
  }, [userId]); // Re-initialize cache when user changes
  
  // Define a complete Post object matching all required properties with all the required fields
  const defaultPost = {
    id: 0, // Use 0 instead of negative ID
    clerk_id: userId,
    user_id: userId,
    firstname: "",
    username: "",
    content: "Hi, I am a new Colore User!",
    created_at: new Date().toISOString(), // Valid date string
    expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    city: "",
    state: "",
    country: "",
    like_count: 0,
    report_count: 0,
    unread_comments: 0,
    recipient_user_id: "",
    pinned: true,
    color: "yellow",
    emoji: "",
    notified: true,
    prompt_id: 0, // Use 0 instead of negative ID
    prompt: "",
    board_id: 0,
    reply_to: 0, // Use 0 instead of negative ID
    // Adding missing required properties
    nickname: "",
    incognito_name: "",
    available_at: new Date().toISOString(), // Valid date string
    static_emoji: false,
    formatting: [],
    formatting_encrypted: "",
    unread: false 
  } as unknown as Post;

  // Function to decrypt posts and cache the results
  const decryptPosts = useCallback((postsToDecrypt: Post[]) => {
    if (!encryptionKey || postsToDecrypt.length === 0) {
      return postsToDecrypt;
    }
    
    // First filter out posts that need decryption (optimization)
    const postsNeedingDecryption = postsToDecrypt.filter(post => {
      // Skip posts that don't need decryption
      if (!post.recipient_user_id || !post.content || typeof post.content !== 'string' || !post.content.startsWith('U2FsdGVkX1')) {
        return false;
      }
      // Skip posts already in cache
      if (decryptedPostsCache.current.has(post.id)) {
        return false;
      }
      return true;
    });

    // If nothing needs decryption, return original posts with cached items replaced
    if (postsNeedingDecryption.length === 0) {
      console.log(`[DEBUG] UserProfile - All ${postsToDecrypt.length} posts already cached, no decryption needed`);
      // Replace posts with cached versions where available
      return postsToDecrypt.map(post => decryptedPostsCache.current.get(post.id) || post);
    }
    
    console.log(`[DEBUG] UserProfile - Decrypting ${postsNeedingDecryption.length} out of ${postsToDecrypt.length} posts`);
    
    // Process each post, using cache when possible
    return postsToDecrypt.map(post => {
      // Check if this post is already in cache
      const cachedPost = decryptedPostsCache.current.get(post.id);
      if (cachedPost) {
        return cachedPost;
      }
      
      // Post needs decryption
      if (post.recipient_user_id && 
          typeof post.content === 'string' && 
          post.content.startsWith('U2FsdGVkX1')) {
        try {
          const decryptedContent = decryptText(post.content, encryptionKey);
          
          // Handle formatting - check both formatting and formatting_encrypted fields
          let decryptedFormatting = post.formatting;
          
          // If formatting_encrypted exists, it takes precedence (newer format)
          if (post.formatting_encrypted && typeof post.formatting_encrypted === "string") {
            try {
              const decryptedFormattingStr = decryptText(post.formatting_encrypted, encryptionKey);
              decryptedFormatting = JSON.parse(decryptedFormattingStr);
            } catch (formattingError) {
              console.warn(`[DEBUG] UserProfile - Failed to decrypt formatting_encrypted for post ${post.id}`, formattingError);
            }
          } 
          // Otherwise try the old way (formatting as encrypted string)
          else if (post.formatting && typeof post.formatting === "string" && 
                  ((post.formatting as string).startsWith('U2FsdGVkX1') || (post.formatting as string).startsWith('##FALLBACK##'))) {
            try {
              const decryptedFormattingStr = decryptText(post.formatting as unknown as string, encryptionKey);
              decryptedFormatting = JSON.parse(decryptedFormattingStr);
            } catch (formattingError) {
              console.warn(`[DEBUG] UserProfile - Failed to decrypt formatting for post ${post.id}`, formattingError);
            }
          }
          
          // Create decrypted post object
          const decryptedPost = { 
            ...post, 
            content: decryptedContent, 
            formatting: decryptedFormatting 
          };
          
          // Cache the decrypted post
          decryptedPostsCache.current.set(post.id, decryptedPost);
          
          return decryptedPost;
        } catch (e) {
          console.warn(`[DEBUG] UserProfile - Failed decryption for post ${post.id}`, e);
          return post;
        }
      }
      return post;
    });
  }, [encryptionKey]);

  // Preload posts when the profile is first loaded
  const preloadPosts = useCallback(async () => {
    if (postsPreloaded && postsDecrypted) return;
    
    try {
      console.log("[DEBUG] UserProfile - Preloading posts for user:", userId);
      const response = await fetchAPI(
        `/api/posts/getUserPosts?id=${userId}&page=0`,
        { method: "GET" }
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const { userInfo, posts, pagination } = response as UserData;
      
      // Process and decrypt posts
      setProfileUser(userInfo);
      
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
      
      console.log("[DEBUG] UserProfile - Posts preloaded successfully");
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
      
      setProfileUser(userInfo);
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
      console.log("[DEBUG] UserProfile - Posts are loaded and encryption key is available, marking as decrypted");
      setPostsDecrypted(true);
    }
  }, [userPosts, encryptionKey, postsDecrypted]);

  const loadMorePosts = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setPage(prevPage => prevPage + 1);
      fetchUserData(false);
    }
  }, [isLoadingMore, hasMore, fetchUserData]);

  const fetchUserPosts = useCallback(async () => {
    try {
      const response = await fetchAPI(`/api/posts/getUserPosts?id=${userId}`, {
        method: "GET",
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const { posts } = response;
      setUserPosts(posts);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    }
  }, [userId]);

  const fetchPersonalPosts = useCallback(async () => {
    try {
      const response = await fetchAPI(
        `/api/posts/getPersonalPosts?number=${8}&recipient_id=${userId}&user_id=${user!.id}`
      );

      // Handle invalid or empty response data more carefully
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.log("[DEBUG] UserProfile - No valid personal posts data received");
        setDisableInteractions(true);
        setPersonalPosts([]);
        return;
      }

      const filteredPosts = response.data.filter((p: Post) => p && p.pinned);

      if (filteredPosts.length === 0) {
        console.log("[DEBUG] UserProfile - No pinned posts found");
        setDisableInteractions(true);
        setPersonalPosts([]);
      } else {
        console.log(`[DEBUG] UserProfile - Found ${filteredPosts.length} pinned posts`);
        // Decrypt personal posts using our caching logic
        if (encryptionKey) {
          const decryptedPosts = decryptPosts(filteredPosts);
          setPersonalPosts(decryptedPosts);
        } else {
          setPersonalPosts(filteredPosts);
        }
      }
    } catch (error) {
      console.error("[DEBUG] UserProfile - Failed to fetch personal posts:", error);
      setDisableInteractions(true);
      setPersonalPosts([]);
    }
  }, [userId, user, encryptionKey, decryptPosts]);

  const fetchPersonalBoards = useCallback(async () => {
    // Use data from context instead of direct API call
    if (personalBoards) {
      // Convert ContextBoard[] to UserBoard[] by adding required properties
      // The Board from context is different from the Board in types.d.ts
      const convertedBoards = personalBoards.map(board => ({
        ...board,
        commentAllowed: true, // Required by UserBoard type
        isNew: false,
        isPrivate: board.board_type === 'private',
        // Properly convert the board to match the expected UserBoard type
      }));
      // Use type assertion to avoid TypeScript errors when adding the missing property
      setMyBoards(convertedBoards as unknown as UserBoard[]);
    }
  }, [personalBoards]);

  const fetchCommunityBoards = useCallback(async () => {
    // Use data from context instead of direct API call
    // No need to set communityBoards as we're using it from context
  }, []);

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
      name: "Posts",
      key: "Posts",
      color: "#CFB1FB",
      notifications: unreadComments,
    },
    { name: "Settings", key: "Settings", color: "#93c5fd", notifications: 0 },
  ];

  const userTabs = [
    { name: "Profile", key: "Profile", color: "#CFB1FB", notifications: 0 },
    { name: "Boards", key: "Boards", color: "#CFB1FB" },
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

  // Fix the empty posts view with better guidance
  const EmptyPostsView = () => (
    <View className="flex items-center justify-center p-10 bg-white/80 rounded-3xl">
      <Text className="font-JakartaSemiBold text-gray-700 text-center mb-2">
        No pinned posts yet
      </Text>
      <Text className="font-Jakarta text-gray-500 text-center">
        Pin your favorite posts to your profile by tapping the three dots (⋯) 
        at the bottom right of any post and selecting "Pin to profile".
      </Text>
    </View>
  );

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
                {friendNickname || profileUser?.username ? (
                  <Text className={`text-xl font-JakartaBold`}>
                    {friendNickname
                      ? friendNickname
                      : profileUser?.username
                        ? `${friendStatus === FriendStatus.RECEIVED || friendStatus === FriendStatus.FRIENDS ? profileUser?.nickname || profileUser?.username : profileUser?.username}`
                        : `${profileUser?.firstname?.charAt(0)}.`}{" "}
                  </Text>
                ) : (
                  <Text
                    className={`text-xl bg-[#E7E5Eb] text-[#E7E5Eb] font-JakartaBold`}
                  >
                    Username
                  </Text>
                )}
                {profileUser ? (
                  <View className="max-w-[200px]">
                    <Text className=" text-[14px] text-gray-600 text-left font-Jakarta">
                      {profileUser?.city == profileUser?.state
                        ? ""
                        : `${profileUser?.city}, `}{" "}
                      {profileUser?.country}
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
                    Posts
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
              <>{/* PLACEHOLDER FOR COLOR COUNT */}</>
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
          {!profileLoading ? (
            <View className={`absolute -top-[20%]`}>
              {personalPosts.length > 0 ? (
                <PostContainer
                  selectedPosts={personalPosts}
                  handleCloseModal={() => {}}
                  isPreview={disableInteractions}
                />
              ) : (
                <EmptyPostsView />
              )}
            </View>
          ) : (
            <View className={`absolute -top-[25%]`}>
              {/* Show a loading state instead of a placeholder post */}
              <View className="flex items-center justify-center p-10">
                <ActivityIndicator size="large" color="#CFB1FB" />
              </View>
            </View>
          )}
        </View>
      )}

      {selectedTab === "Posts" && (
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
              placeholder="Looking for a Post..?"
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

      {selectedTab === "Boards" && (
        <View className="flex-1 pt-4">
          <BoardGallery boards={myBoards} />
        </View>
      )}

            {selectedTab === "Communities" && <View className="flex-1 pt-4">
            <BoardGallery 
              boards={communityBoards}
              offsetY={120} />
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
