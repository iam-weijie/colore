import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { UserProfileType, UserNicknamePair } from "@/types/type";

export type UserDataContextType = {
  savedPosts: string[];
  nicknames: Record<string, string>;
  userData: UserProfileType | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  addSavedPost: (postId: string | number) => void;
  removeSavedPost: (postId: string | number) => void;
  getNicknameFor: (userId: string) => string;
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [userData, setUserData] = useState<UserProfileType | null>(null);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user.id}`, {
        method: "GET",
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const userDataResponse = response.data?.[0];
      if (!userDataResponse) {
        throw new Error("User data not found");
      }
      
      setUserData(userDataResponse);
      
      // Extract saved posts
      const userSavedPosts = userDataResponse.saved_posts || [];
      setSavedPosts(userSavedPosts);
      
      // Extract nicknames
      const userNicknames: UserNicknamePair[] = userDataResponse.nicknames || [];
      const nicknamesMap = convertNicknamesToMap(userNicknames);
      setNicknames(nicknamesMap);
    } catch (error) {
      console.error("[UserDataContext] Failed to fetch user data:", error);
      setError("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const convertNicknamesToMap = (nicknamesPairs: UserNicknamePair[]): Record<string, string> => {
    return nicknamesPairs.reduce((acc: Record<string, string>, [userId, nickname]) => {
      if (nickname) {
        acc[userId] = nickname;
      }
      return acc;
    }, {});
  };

  // Add a saved post
  const addSavedPost = useCallback((postId: string | number) => {
    setSavedPosts(prev => {
      if (prev.includes(String(postId))) return prev;
      return [...prev, String(postId)];
    });
  }, []);

  // Remove a saved post
  const removeSavedPost = useCallback((postId: string | number) => {
    setSavedPosts(prev => prev.filter(id => id !== String(postId)));
  }, []);

  // Get nickname for a user ID
  const getNicknameFor = useCallback((userId: string) => {
    return nicknames[userId] || "";
  }, [nicknames]);

  // Initial fetch
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <UserDataContext.Provider
      value={{
        savedPosts,
        nicknames,
        userData,
        loading,
        error,
        refreshUserData: fetchUserData,
        addSavedPost,
        removeSavedPost,
        getNicknameFor,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserDataContext = () => {
  const ctx = useContext(UserDataContext);
  if (!ctx)
    throw new Error("useUserDataContext must be used within a UserDataProvider");
  return ctx;
}; 