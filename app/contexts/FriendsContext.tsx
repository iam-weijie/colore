import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { UserNicknamePair } from "@/types/type";

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderNickname?: string;
  receiverId: string;
  receiverUsername: string;
  receiverNickname?: string;
  status: string;
  createdAt: string;
}

export interface Friendship {
  id: string;
  friend_id: string;
  friend_username: string;
  friend_nickname?: string;
  city: string;
  state: string;
  country: string;
}

export interface FriendRequestList {
  sent: FriendRequest[];
  received: FriendRequest[];
}

export type FriendsContextType = {
  friendList: Friendship[];
  friendRequests: FriendRequestList;
  nicknames: Record<string, string>;
  loading: boolean;
  error: string | null;
  refreshFriends: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
  refreshNicknames: () => Promise<void>;
};

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [friendList, setFriendList] = useState<Friendship[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestList>({ sent: [], received: [] });
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriendList = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const data = await fetchFriends(user.id);
      setFriendList(data);
    } catch (error) {
      console.error("[FriendsContext] Failed to fetch friend list:", error);
      setError("Failed to fetch friend list");
    }
  }, [user]);

  const fetchFriends = async (userId: string): Promise<Friendship[]> => {
    try {
      const response = await fetchAPI(`/api/friends/getFriends?userId=${userId}`, { 
        method: "GET" 
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error("[FriendsContext] Failed to fetch friends:", error);
      return [];
    }
  };

  const fetchFriendRequests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetchAPI(
        `/api/friends/getFriendRequests?userId=${user.id}`,
        { method: "GET" }
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const processedFriendRequests = processFriendRequests(response.data);
      const sentFriendRequests = processedFriendRequests.filter(
        (friendRequest) => friendRequest.senderId === user.id
      );
      const receivedFriendRequests = processedFriendRequests.filter(
        (friendRequest) => friendRequest.receiverId === user.id
      );
      
      setFriendRequests({
        sent: sentFriendRequests,
        received: receivedFriendRequests,
      });
    } catch (error) {
      console.error("[FriendsContext] Failed to fetch friend requests:", error);
      setError("Failed to fetch friend requests");
    }
  }, [user]);

  const processFriendRequests = (friendRequestData: any[]): FriendRequest[] => {
    return friendRequestData.map((friendRequest) => {
      const isRequestorUID1 = friendRequest.requestor === "UID1";
      return {
        id: friendRequest.id,
        senderId: isRequestorUID1 ? friendRequest.user_id1 : friendRequest.user_id2,
        senderUsername: isRequestorUID1 ? friendRequest.user1_username : friendRequest.user2_username,
        senderNickname: friendRequest.user1_nickname || friendRequest.user2_nickname,
        receiverId: isRequestorUID1 ? friendRequest.user_id2 : friendRequest.user_id1,
        receiverUsername: isRequestorUID1 ? friendRequest.user2_username : friendRequest.user1_username,
        receiverNickname: friendRequest.user2_nickname || friendRequest.user1_nickname,
        status: friendRequest.status,
        createdAt: friendRequest.created_at,
      };
    });
  };

  const fetchNicknames = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user.id}`, {
        method: "GET",
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const nicknames = response.data?.[0]?.nicknames || [];
      setNicknames(convertNicknameDictionary(nicknames));
    } catch (error) {
      console.error("[FriendsContext] Failed to fetch nicknames:", error);
      setError("Failed to fetch nicknames");
    }
  }, [user]);

  const convertNicknameDictionary = (userNicknameArray: UserNicknamePair[]): Record<string, string> => {
    return userNicknameArray.reduce((acc: Record<string, string>, [userId, nickname]) => {
      acc[userId] = nickname;
      return acc;
    }, {});
  };

  const refreshAll = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchFriendList(),
        fetchFriendRequests(),
        fetchNicknames(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [user, fetchFriendList, fetchFriendRequests, fetchNicknames]);

  // Initial data load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <FriendsContext.Provider
      value={{
        friendList,
        friendRequests,
        nicknames,
        loading,
        error,
        refreshFriends: fetchFriendList,
        refreshFriendRequests: fetchFriendRequests,
        refreshNicknames: fetchNicknames,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriendsContext = () => {
  const ctx = useContext(FriendsContext);
  if (!ctx)
    throw new Error("useFriendsContext must be used within a FriendsProvider");
  return ctx;
};

export default FriendsProvider; 