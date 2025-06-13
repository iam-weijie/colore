import PostModal from "@/components/PostModal";
import UserProfile from "@/components/UserProfile";
import { fetchAPI } from "@/lib/fetch";
import { Post, FriendStatusType } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { useGlobalContext } from "@/app/globalcontext";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { setEncryptionKey } = useGlobalContext();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { post, commentId, tab } = useLocalSearchParams();

  const parsedPost = post && JSON.parse(post) as Post 

  const handleSignOut = async () => {
    signOut();
    setEncryptionKey(null);
    router.replace("/auth/log-in");
  };

  useEffect(() => {
    if (post) {
setTimeout(() => {setIsModalVisible(true)}, 500)
    }
    
  }, [post])
  
  return (
       <View className="flex-1 bg-[#FAFAFA]">
      {user && <UserProfile userId={user.id} onSignOut={handleSignOut} tab={tab}/>}
       {isModalVisible && (

        <PostModal
          isVisible={isModalVisible}
          selectedPosts={[parsedPost]}
          handleCloseModal={() => {
            setIsModalVisible(false)}}
          seeComments={!!commentId} 
        />
    )}
  </View>
  );
};

export default Profile;
