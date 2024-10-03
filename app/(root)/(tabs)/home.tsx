import PostIt from "@/components/PostIt";
import PostModal from "@/components/PostModal";
import { icons } from "@/constants";
import { Post } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const { user } = useUser();

  const fetchRandomPosts = async () => {
    try {
      const response = await fetch(
        `/(api)/(posts)/getRandomPosts?number=${3}&id=${user!.id}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // set positions of posts
      const postsWithPositions = result.data.map((post: Post) => ({
        ...post,
        position: {
          top: Math.random() * 300,
          left: Math.random() * 200,
        },
      }));
      setPosts(postsWithPositions);
    } catch (error) {
      setError("Failed to fetch random posts.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomPosts();
  }, []);

  const handlePostPress = (post: any) => {
    setSelectedPost(post);
  };

  const handleNewPostPress = () => {
    router.push("/(root)/new-post");
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handleReloadPosts = () => {
    setLoading(true);
    fetchRandomPosts();
  };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-row justify-between items-center p-3">
          <Text className="text-2xl font-JakartaBold">Coloré</Text>
        </View>
        {loading ? (
          <SafeAreaView className="flex-1">
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          </SafeAreaView>
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <View className="relative flex-1">
            {posts.map((post, index) => {
              return (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => handlePostPress(post)}
                  style={{
                    position: "absolute",
                    top: post.position.top,
                    left: post.position.left,
                  }}
                >
                  <PostIt />
                </TouchableOpacity>
              );
            })}

            {selectedPost && (
              <PostModal
                isVisible={!!selectedPost}
                post={selectedPost}
                handleCloseModal={handleCloseModal}
              />
            )}
          </View>
        )}

        <View>
          <View className="absolute bottom-32 right-6 flex flex-col items-center space-y-8 z-10">
            <TouchableOpacity onPress={handleReloadPosts}>
              <Image source={icons.refresh} className="w-8 h-8" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNewPostPress}>
              <Image source={icons.pencil} className="w-7 h-7" />
            </TouchableOpacity>
          </View>
        </View>
      </SignedIn>
    </SafeAreaView>
  );
}
