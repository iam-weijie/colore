import React, { useState, useEffect } from "react";
import { Post } from "@/types/type";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import {
  TouchableOpacity,
  View,
  Image,
  Text,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import PostGallery from "@/components/PostGallery";
import { icons } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";

const SavedPostGallery = () => {
  const router = useRouter();
  const { user } = useUser();
  const [query, setQuery] = useState<string>("");
  const { posts, name } = useLocalSearchParams();
  const [savedPostsList, setSavedPostsList] = useState<Post[]>([]);
  const [update, setUpdate] = useState<boolean>(false);
  const [savedPostsID, setSavedPostsID] = useState<string[]>(
    typeof posts === "string" ? JSON.parse(posts) : posts
  );
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (ids: string[], currentPage: number = 0) => {
    try {
      setIsLoading(true);
      const response = await fetchAPI(`/api/posts/getPostsById?ids=${ids}&page=${currentPage}&limit=25`);
      const postsData = response.data;
      const pagination = response.pagination;
      
      setHasMore(pagination.hasMore);
      
      const sortedPosts = postsData.sort((a, b) => a.color.localeCompare(b.color));
      return sortedPosts;
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSavedPosts = async () => {
      // Reset when posts changes
      setSavedPostsList([]);
      setPage(0);
      setHasMore(true);
      
      // Fetch first page of posts
      const response = await fetchPosts(savedPostsID, 0);

      // Filter out null values (failed fetches)
      setSavedPostsList(
        response.filter((post: Post) => post !== undefined) as Post[]
      );

      setUpdate(false);
    };

    if (posts) {
      fetchSavedPosts();
    }
  }, [posts, update]);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    
    const nextPage = page + 1;
    const morePosts = await fetchPosts(savedPostsID, nextPage);
    
    if (morePosts.length > 0) {
      setSavedPostsList(prevPosts => [
        ...prevPosts,
        ...morePosts.filter((post: Post) => post !== undefined)
      ]);
      setPage(nextPage);
    }
  };

  const handleUpdate = (postId: number, isRemoved: boolean) => {
    if (isRemoved) {
      setSavedPostsID((prevPost) => prevPost.filter((id) => id != `${postId}`));
    }

    setUpdate(true);
  };

  const handleClearSearch = () => {
    setQuery("");
  };
  return (
    <View className="flex-1 bg-[#FAFAFA]">
     <Header 
     title={Array.isArray(name) ? name.join(", ") : name}
     />
      {savedPostsList.length > 0 ? (
        <View className="flex-1 flex flex-column items-center px-6 pt-6">
            <View className="flex flex-row items-center bg-white rounded-[24px] px-4 h-12 "
        style={{
          boxShadow: "0 0 7px 1px rgba(120,120,120,.1)"
        }}
        >
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 pl-2 text-md "
            placeholder="Search emojis..."
             placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              className="w-6 h-6 items-center justify-center"
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
          <View className=" flex-1"
          style={{
            width: '100%'
          }}>
            <PostGallery
              posts={savedPostsList}
              profileUserId={user!.id}
              handleUpdate={(id, isRemoved) => {
                handleUpdate(id, isRemoved);
              }}
              query={query}
              onLoadMore={handleLoadMore}
              isLoading={isLoading}
              hasMore={hasMore}
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
        </View>
      ) : (
        <View className="flex-1 flex mb-12 items-center justify-center">
          <Text className="text-gray-600 text-base  text-center">
            You have no {name == "Saved Posts" ? "saved" : "liked"} posts.
          </Text>
        </View>
      )}
      <View className="absolute w-full flex-row items-center justify-between bottom-12  px-8 ">
      <TouchableOpacity onPress={() => router.back()} className="p-4 rounded-full bg-white shadow-md ">
          <AntDesign name="caretleft" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SavedPostGallery;
