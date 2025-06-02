import PostModal from "@/components/PostModal";
import UserProfile from "@/components/UserProfile";
import { fetchAPI } from "@/lib/fetch";
import { Post } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView, View } from "react-native";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [post, setPost] = React.useState<Post>();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const { notification, tab, triggerAction } = useLocalSearchParams()

    const fetchPosts = async (id: string[]) => {
      try {
        const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`);
        const post = response.data;
  
        if (!post || post.length === 0) {
          return null;
        }
        setPost(post);
        setIsModalVisible(true);
      } catch (error) {
        return null;
      }
    };


  useEffect(() => {
    if (notification) {
      const notification = JSON.parse(notification);
      const postId: number = notification.post_id;

      fetchPosts([postId.toString()])
     
     
    }
  }, [notification]);
  const handleSignOut = async () => {
    signOut();
    router.replace("/auth/log-in");
  };

  return (
    <View className="flex-1">
      {user && <UserProfile userId={user?.id} tab={tab ?? ""} onSignOut={handleSignOut} />}
      {triggerAction && isModalVisible && post &&
      <PostModal isVisible={triggerAction == "openModal"} selectedPosts={[post]} handleCloseModal={() => {setIsModalVisible(false)}} />}

      </View>
  );
};

export default Profile;
