import PostIt from "@/components/PostIt";
import { icons } from "@/constants";
import { SignedIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import ReactNativeModal from "react-native-modal";
import { Image, Text, TouchableOpacity, View, FlatList, Button, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const fetchRandomPosts = async () => {
    try {
      const response = await fetch(`/(api)/(posts)/getRandomPosts?number=${6}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      setPosts(result.data);
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
            <View className="flex flex-row space-x-4">
              <TouchableOpacity onPress={handleReloadPosts}>
                <Image source={icons.refresh} className="w-8 h-8" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNewPostPress}>
                <Image source={icons.pencil} className="w-7 h-7" />
              </TouchableOpacity>
            </View>
          </View>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : error ? (
          <Text>{error}</Text>
        ) : (
        <View className="relative flex-1">
           <FlatList
              className="mx-3"
              data={posts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-1 m-3"
                  onPress={() => handlePostPress(item)}
                >
                  <PostIt />
                </TouchableOpacity>
              )}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }} 
            />
            {selectedPost && (
              <ReactNativeModal isVisible={!!selectedPost}>
                <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
                  <Text>{selectedPost.content}</Text>
                  <Text>
                    Posted by: {selectedPost.firstname} {selectedPost.lastname}
                    {"\n"}
                    {selectedPost.city}, {selectedPost.state},{" "}
                    {selectedPost.country}
                  </Text>
                  <View>
                    <Text>Likes: {selectedPost.likes_count}</Text>
                    <Text>Comments: {selectedPost.reports_count}</Text>
                  </View>
                  <Button title="Close" onPress={handleCloseModal} />
                </View>
              </ReactNativeModal>
            )}
        </View>
        )}

        {/* <View>
          <View className="absolute bottom-32 right-6 flex flex-col items-center space-y-8">
            <TouchableOpacity>
              <Image source={icons.refresh} className="w-8 h-8" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNewPostPress}>
              <Image source={icons.pencil} className="w-7 h-7" />
            </TouchableOpacity>
          </View>
        </View> */}
      </SignedIn>
    </SafeAreaView>
  );
}
