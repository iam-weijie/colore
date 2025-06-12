import PostModal from "@/components/PostModal";
import UserProfile from "@/components/UserProfile";
import { fetchAPI } from "@/lib/fetch";
import { Post, FriendStatusType } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView, View } from "react-native";
import { useGlobalContext } from "@/app/globalcontext";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { setEncryptionKey } = useGlobalContext();
  const [post, setPost] = React.useState<Post>();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const params = useLocalSearchParams();
  const notificationParam = params.notification as string | undefined;
  const tabParam = params.tab as string | undefined;
  const triggerActionParam = params.triggerAction as string | undefined;

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
    if (notificationParam) {
      try {
        const notifObj = JSON.parse(notificationParam);
        const postId: number = notifObj.post_id;
        fetchPosts([postId.toString()]);
      } catch {
        // invalid json
      }
    }
  }, [notificationParam]);
  const handleSignOut = async () => {
    signOut();
    setEncryptionKey(null);
    router.replace("/auth/log-in");
  };

  return (
    <View className="flex-1">
      {user && (
        <UserProfile
          userId={user?.id}
          tab={tabParam ?? ""}
          friendStatus={{ name: "" } as FriendStatusType}
          onSignOut={handleSignOut}
        />
      )}
      {triggerActionParam && isModalVisible && post &&
      <PostModal isVisible={triggerActionParam === "openModal"} selectedPosts={[post]} handleCloseModal={() => {setIsModalVisible(false)}} />}

      </View>
  );
};

export default Profile;
