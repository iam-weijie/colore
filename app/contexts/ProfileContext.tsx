import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import { defaultColors } from "@/constants";
import { UserProfileType, PostItColor } from "@/types/type";

// Types
export type ProfileContextType = {
  profile?: UserProfileType;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileType | undefined>>;
  refreshProfile: () => Promise<void>;
  userColors: PostItColor[];
  setUserColors: React.Dispatch<React.SetStateAction<PostItColor[]>>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfileType>();
  const [userColors, setUserColors] = useState<PostItColor[]>(defaultColors);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user.id}`, {
        method: "GET",
      });
      if (response.error) throw new Error(response.error);

      const userData: UserProfileType | undefined = response.data?.[0];
      if (userData) {
        setProfile(userData);
        setUserColors(userData.colors || defaultColors);
      }
    } catch (error) {
      console.error("[ProfileContext] Failed to fetch user profile:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const refreshProfile = fetchUserProfile;

  return (
    <ProfileContext.Provider
      value={{ profile, setProfile, refreshProfile, userColors, setUserColors }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx)
    throw new Error("useProfileContext must be used within a ProfileProvider");
  return ctx;
}; 