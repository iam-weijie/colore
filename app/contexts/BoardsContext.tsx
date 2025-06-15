import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { defaultColors } from "@/constants/colors";

export interface Board {
  id: number;
  title: string;
  user_id: string;
  description: string;
  members_id: string[];
  board_type: string;
  restrictions: string[];
  created_at: string | number;
  color: string;
}

export type BoardsContextType = {
  personalBoards: Board[];
  communityBoards: Board[];
  discoverBoards: Board[];
  loading: boolean;
  error: string | null;
  refreshPersonalBoards: () => Promise<void>;
  refreshCommunityBoards: () => Promise<void>;
  refreshDiscoverBoards: () => Promise<void>;
  refreshAllBoards: () => Promise<void>;
};

const BoardsContext = createContext<BoardsContextType | undefined>(undefined);

export const BoardsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [personalBoards, setPersonalBoards] = useState<Board[]>([]);
  const [communityBoards, setCommunityBoards] = useState<Board[]>([]);
  const [discoverBoards, setDiscoverBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonalBoards = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const response = await fetchAPI(`/api/boards/getBoards?user_id=${user.id}`, {
        method: "GET",
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      const personalBoard: Board = {
        id: -1,
        title: "Personal Board",
        user_id: user.id,
        description: "Your window to the world!",
        members_id: [user.id],
        board_type: 'personal',
        restrictions: ['personal', 'commentsAllowed', '5'],
        created_at: Date.now(),
        color: "#93c5fd"
      };

      const shareWithMeBoard: Board = {
        id: -2,
        title: "Shared with Me",
        user_id: user.id,
        description: "Everything that was share with you!",
        members_id: [user.id],
        board_type: 'personal',
        restrictions: ['personal', 'commentsAllowed', '5'],
        created_at: Date.now(),
        color: "#CFB1FB"
      };

      if (response.data && response.data.length > 0) {
        const boardsWithColor = response.data.map((board: any, index: number) => ({
          ...board,
          color: defaultColors[Math.floor(Math.random() * 3)].hex,
        }));
        
        setPersonalBoards([personalBoard, shareWithMeBoard, ...boardsWithColor]);
      } else {
        setPersonalBoards([personalBoard, shareWithMeBoard]);
      }
    } catch (error) {
      console.error("[BoardsContext] Failed to fetch personal boards:", error);
      setError("Failed to fetch personal boards");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchCommunityBoards = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const response = await fetchAPI(`/api/boards/getCommunityBoards?userId=${user.id}`, {
        method: "GET",
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && response.data.length > 0) {
        const boardsWithColor = response.data.map((board: any, index: number) => ({
          ...board,
          color: defaultColors[Math.floor(Math.random() * 3)].hex,
        }));
        
        setCommunityBoards(boardsWithColor);
      } else {
        setCommunityBoards([]);
      }
    } catch (error) {
      console.error("[BoardsContext] Failed to fetch community boards:", error);
      setError("Failed to fetch community boards");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchDiscoverBoards = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const response = await fetchAPI(`/api/boards/getDiscoverBoards`, {
        method: "GET",
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && response.data.length > 0) {
        const boardsWithColor = response.data.map((board: any, index: number) => ({
          ...board,
          color: defaultColors[Math.floor(Math.random() * 3)].hex,
        }));
        
        setDiscoverBoards(boardsWithColor);
      } else {
        setDiscoverBoards([]);
      }
    } catch (error) {
      console.error("[BoardsContext] Failed to fetch discover boards:", error);
      setError("Failed to fetch discover boards");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshAllBoards = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchPersonalBoards(),
        fetchCommunityBoards(),
        fetchDiscoverBoards(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [user, fetchPersonalBoards, fetchCommunityBoards, fetchDiscoverBoards]);

  // Initial data load
  useEffect(() => {
    refreshAllBoards();
  }, [refreshAllBoards]);

  return (
    <BoardsContext.Provider
      value={{
        personalBoards,
        communityBoards,
        discoverBoards,
        loading,
        error,
        refreshPersonalBoards: fetchPersonalBoards,
        refreshCommunityBoards: fetchCommunityBoards,
        refreshDiscoverBoards: fetchDiscoverBoards,
        refreshAllBoards,
      }}
    >
      {children}
    </BoardsContext.Provider>
  );
};

export const useBoardsContext = () => {
  const ctx = useContext(BoardsContext);
  if (!ctx)
    throw new Error("useBoardsContext must be used within a BoardsProvider");
  return ctx;
}; 