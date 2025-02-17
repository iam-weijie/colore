import { SignedIn, useUser } from "@clerk/clerk-expo";
import PostItBoard from "@/components/PostItBoard";
import { fetchAPI } from "@/lib/fetch";
import { 
  Image, 
  SafeAreaView, 
  View, 
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { icons } from "@/constants";

export default function Page() {
  const { user } = useUser();

  const fetchPosts = async () => {
    const response = await fetchAPI(`/api/posts/getRandomPosts?number=${4}&id=${user!.id}`);
    return response.data;
  };

  const fetchNewPost = async () => {
    const response = await fetchAPI(`/api/posts/getRandomPosts?number=${1}&id=${user!.id}`);
    return response.data[0];
  };

  const handleNewPostPress = () => {
      router.push("/root/new-post");
  };

  return (
    <SafeAreaView className="flex-1">
      <SignedIn>
        <View className="flex-row justify-between items-center mx-7 mt-3">
          <Image
            source={require("@/assets/colore-word-logo.png")}
            style={{ width: 120, height: 50 }}
            resizeMode="contain"
            accessibilityLabel="Colore logo"
          />
          <TouchableOpacity onPress={handleNewPostPress}>
            <Image source={icons.pencil} className="w-7 h-7" />
          </TouchableOpacity>
        </View>
        <PostItBoard 
          userId={user!.id}
          handlePostsRefresh={fetchPosts}
          handleNewPostFetch={fetchNewPost}
          onWritePost={handleNewPostPress}
          allowStacking={true}
        />
      </SignedIn>
    </SafeAreaView>
  );
}
