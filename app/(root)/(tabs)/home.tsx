import { useEffect, useState } from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { Text, Button, FlatList, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  const { user } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleNewPostPress = () => {
    router.push("/(root)/new-post");
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
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View>
                <Text>{item.content}</Text>
              </View>
            )}
          />
        )}
      </SignedIn>
    </SafeAreaView>
  );
}
