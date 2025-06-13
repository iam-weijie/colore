import PostModal from "@/components/PostModal";
import UserProfile from "@/components/UserProfile";
import { fetchAPI } from "@/lib/fetch";
import { Post, FriendStatusType } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { useGlobalContext } from "@/app/globalcontext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FriendStatus } from "@/lib/enum";

const ENCRYPTION_KEY_STORAGE = "encryptionKey";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { setEncryptionKey } = useGlobalContext();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const params = useLocalSearchParams();
  const post = params.post ? String(params.post) : undefined;
  const commentId = params.commentId ? String(params.commentId) : undefined;
  const tab = params.tab ? String(params.tab) : "posts";

  const parsedPost = post ? JSON.parse(post) as Post : null;
  
  const handleSignOut = async () => {
    try {
      // Clear encryption key from AsyncStorage
      await AsyncStorage.removeItem(ENCRYPTION_KEY_STORAGE);
      console.log("[DEBUG] Profile - Cleared encryption key from storage");
      
      // Clear encryption key from context
      setEncryptionKey(null);
      
      // Sign out the user
      await signOut();
      router.replace("/auth/log-in");
    } catch (error) {
      console.error("[DEBUG] Profile - Error during sign out:", error);
      // Still try to sign out even if there was an error
      await signOut();
      router.replace("/auth/log-in");
    }
  };

  useEffect(() => {
    if (post) {
      setTimeout(() => {setIsModalVisible(true)}, 500);
    }
  }, [post]);
  
  return (
    <View className="flex-1 bg-[#FAFAFA]">
      {user && <UserProfile 
        userId={user.id} 
        onSignOut={handleSignOut} 
        tab={tab}
        friendStatus={FriendStatus.UNKNOWN}
      />}
      {isModalVisible && parsedPost && (
        <PostModal
          isVisible={isModalVisible}
          selectedPosts={[parsedPost]}
          handleCloseModal={() => {
            setIsModalVisible(false);
          }}
          seeComments={!!commentId} 
        />
      )}
    </View>
  );
};

export default Profile;
