import React, { useState, useEffect} from "react";
import { Post} from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import {
  SafeAreaView,
  TouchableOpacity,
  View,
  Image,
  Text,
  TextInput
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import PostGallery from "@/components/PostGallery";
import { icons } from "@/constants";

const SavedPostGallery = () => {
  const router = useRouter();
  const { user } = useUser();
  const [query, setQuery] = useState<string>("");
  const { posts } = useLocalSearchParams();
  const [savedPostsList, setSavedPostsList] = useState<Post[]>([]);
  const [update, setUpdate] = useState<boolean>(false);
  const [savedPostsID, setSavedPostsID] = useState<string[]>(typeof posts === "string" ? JSON.parse(posts) : posts);

  const fetchPosts = async (ids: string[]) => {
    try {
      const response = await fetchAPI(`/api/posts/getPostsById?ids=${ids}`);
     
      return response.data || null; // Return null if no post is found
    } catch (error) {
      return null;
    }
  };
  
  useEffect(() => {
    const fetchSavedPosts = async () => {
  
        // Fetch all posts asynchronously
        const response = await fetchPosts(savedPostsID)
  
        // Filter out null values (failed fetches)
        setSavedPostsList(response.filter((post: Post) => post !== undefined) as Post[]);
     
     setUpdate(false)
    };
  
    if (posts) {
      fetchSavedPosts();
    }
  }, [posts, update]);

  const handleUpdate = () => {
    console.log("dd")
      const fetchUserData = async () => {
        try {
          const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`);
          const data = response.data[0];
          setSavedPostsID(data.saved_posts)
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      };
    fetchUserData
    setUpdate(true)
  }


  return (
    <SafeAreaView className="flex-1">
         <View className="flex flex-row items-center px-4 pt-2">
            <View>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-2"
            >
              <AntDesign name="caretleft" size={18} />
            </TouchableOpacity>
            </View>
            <View>
              <Text className="font-JakartaBold text-2xl">
                Saved Posts
              </Text>
            </View>
          </View>
        { savedPostsList.length > 0 ? (
          <View className="flex-1 flex flex-column items-center px-6 pt-6">
          <TextInput
                          className="w-full  h-12 px-5 rounded-[16px] bg-gray-200 mb-6"
                          placeholder="Search"
                          onChangeText={setQuery}
                          value={query}
                        />
        <View className="flex-1">
        <PostGallery
        posts={savedPostsList}
        profileUserId={user!.id}
        handleUpdate={handleUpdate}
        query={query}
        header={
          <View className="w-screen px-8 flex flex-row items-center justify-between">
                  <View>
                    <Text className="text-lg font-JakartaSemiBold">
                      Most Recent 
                    </Text>
                  </View>
                  </View>

        }
        />
        </View>
        </View>) : (
          <View className="flex-1 flex mb-12 items-center justify-center">
            <Text className="text-gray-600 text-base  text-center"> You have no saved posts.</Text>
          </View>
        )}
    </SafeAreaView>
  );
};

export default SavedPostGallery;
