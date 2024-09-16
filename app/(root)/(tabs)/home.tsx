import { useEffect, useState } from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import {
  Text,
  Button,
  FlatList,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNativeModal } from "react-native-modal";

export default function Page() {
  const { user } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    const fetchRandomPosts = async () => {
      try {
        const response = await fetch("/(api)/(posts)/random"); // Adjust the API route as necessary
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

  return (
    <SafeAreaView>
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
        <Button title="New Post" onPress={handleNewPostPress} />
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <View>
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handlePostPress(item)}>
                  <View>
                    <Text>CLICK ME</Text>
                  </View>
                </TouchableOpacity>
              )}
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
      </SignedIn>
    </SafeAreaView>
  );
}
