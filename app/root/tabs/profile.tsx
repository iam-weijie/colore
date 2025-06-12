import PostModal from "@/components/PostModal";
import UserProfile from "@/components/UserProfile";
import { fetchAPI } from "@/lib/fetch";
import { Post } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [post, setPost] = useState<Post>();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { postId, commentId, tab } = useLocalSearchParams();

    const fetchPosts = async (id: string) => {
      try {
        const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`);
        const post = response.data[0];
  
        if (!post || post.length === 0) {
          return null;
        }
        setPost(post);
      } catch (error) {
        return null;
      }
    };


  useEffect(() => {
    if (postId) {
      fetchPosts(String(postId))   
    }
  }, []);
  const handleSignOut = async () => {
    signOut();
    router.replace("/auth/log-in");
  };

  useEffect(() => {
    console.log("[fetchPosts]: ", post)
    setIsModalVisible(true)
  }, [post])
  
  return (
       <View className="flex-1 bg-[#FAFAFA]">
      {/*user  && !!!post && <UserProfile userId={user.id} onSignOut={handleSignOut} tab={tab}/>*/}
       {isModalVisible && post && (
      <View className="absolute inset-0 z-[999]">
        <PostModal
          isVisible={isModalVisible}
          selectedPosts={[post]}
          handleCloseModal={() => {
            setIsModalVisible(false)
            setPost(undefined)}}
          seeComments={!!commentId} 
        />
      </View>
    )}
  </View>
  );
};

export default Profile;
